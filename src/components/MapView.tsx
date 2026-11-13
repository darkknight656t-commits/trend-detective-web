import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import {
  LIBERTY_STYLE_URL,
  ESRI_SATELLITE_URL,
  ESRI_SATELLITE_ATTRIBUTION,
  ESRI_LABELS_URL,
  ESRI_LABELS_ATTRIBUTION,
  NASA_GIBS_OVERLAYS,
  toResilientEsriUrl,
} from '../config/mapLayers.ts';
import { LocationCoordinates } from '../types/api.ts';
import { normalizeLongitude, roundCoord } from '../lib/format.ts';
import { MapSearchBar } from './MapSearchBar.tsx';
import { Layers, Crosshair, AlertTriangle, X } from 'lucide-react';

type BasemapMode = 'map' | 'satellite';

interface MapViewProps {
  mode: 'single' | 'compare';
  singleMarker: LocationCoordinates | null;
  markerA: LocationCoordinates | null;
  markerB: LocationCoordinates | null;
  onMapClick: (coords: LocationCoordinates) => void;
  onLocationSearch?: (coords: LocationCoordinates, label?: string) => void;
  flyToCoords?: { lat: number; lon: number; zoom?: number } | null;
}

const SATELLITE_BACKDROP_ID = 'esri-satellite-backdrop';
const SATELLITE_SOURCE_ID = 'esri-satellite-source';
const SATELLITE_LAYER_ID = 'esri-satellite-layer';
const LABELS_SOURCE_ID = 'esri-labels-source';
const LABELS_LAYER_ID = 'esri-labels-layer';
const GIBS_SOURCE_ID = 'nasa-gibs-overlay-source';
const GIBS_LAYER_ID = 'nasa-gibs-overlay-layer';
const MARKERS_SOURCE_ID = 'selected-markers-source';
const MARKERS_LAYER_ID = 'selected-markers-layer';

let esriProtocolRegistered = false;
let activeTileFetches = 0;
const MAX_CONCURRENT_TILE_FETCHES = 6;
const tileWaitQueue: Array<() => void> = [];

function acquireTileSlot(signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }
  if (activeTileFetches < MAX_CONCURRENT_TILE_FETCHES) {
    activeTileFetches++;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      const idx = tileWaitQueue.indexOf(grant);
      if (idx !== -1) tileWaitQueue.splice(idx, 1);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const grant = () => {
      signal.removeEventListener('abort', onAbort);
      activeTileFetches++;
      resolve();
    };
    signal.addEventListener('abort', onAbort, { once: true });
    tileWaitQueue.push(grant);
  });
}

function releaseTileSlot() {
  activeTileFetches = Math.max(0, activeTileFetches - 1);
  const next = tileWaitQueue.shift();
  if (next) next();
}

function sleepWithAbort(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

let workerConfigured = false;
function ensureMapLibreWorker() {
  if (workerConfigured) return;
  workerConfigured = true;
  maplibregl.setWorkerUrl(maplibreWorkerUrl);
}

function ensureResilientEsriProtocol() {
  ensureMapLibreWorker();
  if (esriProtocolRegistered) return;
  esriProtocolRegistered = true;

  maplibregl.addProtocol(
    'esri-retry',
    async (params: maplibregl.RequestParameters, abortController: AbortController) => {
    const httpsUrl = params.url.replace(/^esri-retry:\/\//, 'https://');
    const maxAttempts = 3;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (abortController.signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      await acquireTileSlot(abortController.signal);
      const timeoutCtrl = new AbortController();
      const onParentAbort = () => timeoutCtrl.abort();
      abortController.signal.addEventListener('abort', onParentAbort, { once: true });
      const timeoutId = window.setTimeout(() => timeoutCtrl.abort(), 9000);

      try {
        const res = await fetch(httpsUrl, { signal: timeoutCtrl.signal });
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          return { data: buffer };
        }
        lastError = new Error(`Tile HTTP ${res.status}`);
        // Do not retry hard 404/400 misses
        if (res.status >= 400 && res.status < 429) {
          throw lastError;
        }
      } catch (err: unknown) {
        if (abortController.signal.aborted) {
          throw err;
        }
        lastError = err;
      } finally {
        window.clearTimeout(timeoutId);
        abortController.signal.removeEventListener('abort', onParentAbort);
        releaseTileSlot();
      }

      if (attempt < maxAttempts - 1) {
        const delayMs = 280 * Math.pow(2, attempt) + Math.floor(Math.random() * 140);
        await sleepWithAbort(delayMs, abortController.signal);
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Tile unavailable');
  });
}

/**
 * Generates crisp 2x HiDPI marker images rendered directly onto MapLibre's WebGL canvas.
 * Native WebGL symbol layers lock markers to the exact GPU frame — zero DOM transform jitter or shake.
 */
function createMarkerBadgeImageData(label: string, bgHex: string): ImageData {
  const size = 64; // 32 CSS px @ 2x pixelRatio
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new ImageData(size, size);
  }

  const cx = size / 2;
  const cy = size / 2;

  // Subtle shadow
  ctx.beginPath();
  ctx.arc(cx, cy + 2, 24, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.fill();

  // Outer white ring
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Colored badge fill
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fillStyle = bgHex;
  ctx.fill();

  // Center glyph / letter
  if (label === '●') {
    ctx.beginPath();
    ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 22px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy + 1);
  }

  return ctx.getImageData(0, 0, size, size);
}

export const MapView: React.FC<MapViewProps> = ({
  mode,
  singleMarker,
  markerA,
  markerB,
  onMapClick,
  onLocationSearch,
  flyToCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onMapClickRef = useRef(onMapClick);

  const [basemap, setBasemap] = useState<BasemapMode>('map');
  const [activeOverlayId, setActiveOverlayId] = useState<string>('base-only');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [mapNotice, setMapNotice] = useState<string | null>(null);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState<boolean>(false);

  const basemapRef = useRef<BasemapMode>(basemap);
  const activeOverlayIdRef = useRef<string>(activeOverlayId);
  const markerStateRef = useRef({ mode, singleMarker, markerA, markerB });

  basemapRef.current = basemap;
  activeOverlayIdRef.current = activeOverlayId;
  markerStateRef.current = { mode, singleMarker, markerA, markerB };

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  interface MarkerFeature {
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: { icon: string };
  }

  const buildMarkersGeoJson = (): {
    type: 'FeatureCollection';
    features: MarkerFeature[];
  } => {
    const st = markerStateRef.current;
    const features: MarkerFeature[] = [];

    if (st.mode === 'single' && st.singleMarker) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [st.singleMarker.lon, st.singleMarker.lat] },
        properties: { icon: 'marker-single' },
      });
    } else if (st.mode === 'compare') {
      if (st.markerA) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [st.markerA.lon, st.markerA.lat] },
          properties: { icon: 'marker-a' },
        });
      }
      if (st.markerB) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [st.markerB.lon, st.markerB.lat] },
          properties: { icon: 'marker-b' },
        });
      }
    }

    return { type: 'FeatureCollection', features };
  };

  // Syncs custom sources/layers in strict order:
  // Liberty style -> satellite backdrop -> satellite imagery -> NASA GIBS -> place labels -> WebGL markers
  const syncCustomLayers = (map: maplibregl.Map) => {
    if (!map.isStyleLoaded()) return;

    const isSat = basemapRef.current === 'satellite';
    const overlay =
      NASA_GIBS_OVERLAYS.find((o) => o.id === activeOverlayIdRef.current) ?? NASA_GIBS_OVERLAYS[0];

    // 1. Register HiDPI marker icons if missing
    if (!map.hasImage('marker-single')) {
      map.addImage('marker-single', createMarkerBadgeImageData('●', '#1A1A1A'), { pixelRatio: 2 });
    }
    if (!map.hasImage('marker-a')) {
      map.addImage('marker-a', createMarkerBadgeImageData('A', '#C8472B'), { pixelRatio: 2 });
    }
    if (!map.hasImage('marker-b')) {
      map.addImage('marker-b', createMarkerBadgeImageData('B', '#2F6C9F'), { pixelRatio: 2 });
    }

    // 2. Neutral backdrop under satellite so slow/missing tiles never punch bright vector map holes
    if (!map.getLayer(SATELLITE_BACKDROP_ID)) {
      map.addLayer({
        id: SATELLITE_BACKDROP_ID,
        type: 'background',
        paint: { 'background-color': '#1D2935' },
        layout: { visibility: isSat ? 'visible' : 'none' },
      });
    } else {
      map.setLayoutProperty(SATELLITE_BACKDROP_ID, 'visibility', isSat ? 'visible' : 'none');
    }

    // 3. Esri Satellite Imagery
    if (!map.getSource(SATELLITE_SOURCE_ID)) {
      map.addSource(SATELLITE_SOURCE_ID, {
        type: 'raster',
        tiles: [toResilientEsriUrl(ESRI_SATELLITE_URL)],
        tileSize: 256,
        maxzoom: 19,
        attribution: ESRI_SATELLITE_ATTRIBUTION,
      });
    }
    if (!map.getLayer(SATELLITE_LAYER_ID)) {
      map.addLayer({
        id: SATELLITE_LAYER_ID,
        type: 'raster',
        source: SATELLITE_SOURCE_ID,
        paint: { 'raster-fade-duration': 150 },
        layout: { visibility: isSat ? 'visible' : 'none' },
      });
    } else {
      map.setLayoutProperty(SATELLITE_LAYER_ID, 'visibility', isSat ? 'visible' : 'none');
    }

    // 4. NASA GIBS Overlay (rebuilt cleanly when tileUrl changes)
    const existingGibsSrc = map.getSource(GIBS_SOURCE_ID) as maplibregl.RasterTileSource | undefined;
    const currentTiles = existingGibsSrc?.tiles;
    const desiredTileUrl = overlay.tileUrl;

    if (!desiredTileUrl) {
      if (map.getLayer(GIBS_LAYER_ID)) map.removeLayer(GIBS_LAYER_ID);
      if (map.getSource(GIBS_SOURCE_ID)) map.removeSource(GIBS_SOURCE_ID);
    } else {
      const needsRecreate = !existingGibsSrc || !currentTiles || currentTiles[0] !== desiredTileUrl;
      if (needsRecreate) {
        if (map.getLayer(GIBS_LAYER_ID)) map.removeLayer(GIBS_LAYER_ID);
        if (map.getSource(GIBS_SOURCE_ID)) map.removeSource(GIBS_SOURCE_ID);
        map.addSource(GIBS_SOURCE_ID, {
          type: 'raster',
          tiles: [desiredTileUrl],
          tileSize: overlay.tileSize,
          maxzoom: overlay.maxzoom,
          attribution: overlay.attribution,
        });
      }
      if (!map.getLayer(GIBS_LAYER_ID)) {
        map.addLayer({
          id: GIBS_LAYER_ID,
          type: 'raster',
          source: GIBS_SOURCE_ID,
          paint: { 'raster-opacity': overlay.opacity, 'raster-fade-duration': 150 },
        });
      }
    }

    // 5. Esri Place-Name Labels (only visible when Satellite is active, above GIBS)
    if (!map.getSource(LABELS_SOURCE_ID)) {
      map.addSource(LABELS_SOURCE_ID, {
        type: 'raster',
        tiles: [toResilientEsriUrl(ESRI_LABELS_URL)],
        tileSize: 256,
        maxzoom: 19,
        attribution: ESRI_LABELS_ATTRIBUTION,
      });
    }
    if (!map.getLayer(LABELS_LAYER_ID)) {
      map.addLayer({
        id: LABELS_LAYER_ID,
        type: 'raster',
        source: LABELS_SOURCE_ID,
        paint: { 'raster-fade-duration': 150 },
        layout: { visibility: isSat ? 'visible' : 'none' },
      });
    } else {
      map.setLayoutProperty(LABELS_LAYER_ID, 'visibility', isSat ? 'visible' : 'none');
    }

    // 6. Native WebGL Markers Layer (always kept at very top)
    const geoJson = buildMarkersGeoJson();
    const existingMarkerSrc = map.getSource(MARKERS_SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;
    if (!existingMarkerSrc) {
      map.addSource(MARKERS_SOURCE_ID, {
        type: 'geojson',
        data: geoJson,
      });
    } else {
      existingMarkerSrc.setData(geoJson);
    }

    if (!map.getLayer(MARKERS_LAYER_ID)) {
      map.addLayer({
        id: MARKERS_LAYER_ID,
        type: 'symbol',
        source: MARKERS_SOURCE_ID,
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      });
    }

    // Enforce exact top-to-bottom stack order
    const orderedIds = [
      SATELLITE_BACKDROP_ID,
      SATELLITE_LAYER_ID,
      GIBS_LAYER_ID,
      LABELS_LAYER_ID,
      MARKERS_LAYER_ID,
    ];
    for (const id of orderedIds) {
      if (map.getLayer(id)) {
        map.moveLayer(id);
      }
    }
  };

  // Initialize MapLibre once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    ensureResilientEsriProtocol();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: LIBERTY_STYLE_URL,
      center: [0, 20],
      zoom: 1.8,
      renderWorldCopies: false,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    const syncMobileAttribution = () => {
      if (window.innerWidth < 640 && mapContainerRef.current) {
        const attrib = mapContainerRef.current.querySelector('.maplibregl-ctrl-attrib');
        attrib?.classList.remove('maplibregl-compact-show');
      }
    };
    map.on('resize', syncMobileAttribution);

    map.getCanvas().style.cursor = 'crosshair';

    map.on('load', () => {
      syncCustomLayers(map);
      syncMobileAttribution();
    });

    map.on('click', (e: maplibregl.MapMouseEvent) => {
      const lat = roundCoord(e.lngLat.lat);
      const lon = roundCoord(normalizeLongitude(e.lngLat.lng));
      onMapClickRef.current({ lat, lon });
    });

    let failedSatelliteTileCount = 0;
    map.on('error', (ev: maplibregl.ErrorEvent & { sourceId?: string }) => {
      const sourceId = ev.sourceId;
      if (sourceId === SATELLITE_SOURCE_ID || sourceId === LABELS_SOURCE_ID) {
        failedSatelliteTileCount++;
        if (failedSatelliteTileCount >= 4 && basemapRef.current === 'satellite') {
          setMapNotice('Some satellite tiles were unavailable; the map remains usable.');
        }
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Re-sync custom layers whenever basemap, NASA overlay, or markers change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (basemap === 'map') {
      setMapNotice(null);
    }

    if (map.isStyleLoaded()) {
      syncCustomLayers(map);
    } else {
      map.once('load', () => syncCustomLayers(map));
    }
  }, [basemap, activeOverlayId, mode, singleMarker, markerA, markerB]);

  // Smooth flyTo for search, geolocation, presets, and URL share links
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToCoords) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      map.jumpTo({
        center: [flyToCoords.lon, flyToCoords.lat],
        zoom: flyToCoords.zoom ?? 7.5,
      });
    } else {
      map.flyTo({
        center: [flyToCoords.lon, flyToCoords.lat],
        zoom: flyToCoords.zoom ?? 7.5,
        duration: 900,
        essential: true,
      });
    }
  }, [flyToCoords]);

  return (
    <div
      data-basemap={basemap}
      className="relative w-full h-full min-h-[280px] overflow-hidden select-none bg-[#E8E5DD]"
    >
      {/* MapLibre Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" aria-label="Interactive climate map" />

      {/* Top-left Search Bar, Geolocation & Map Hint Stack */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-20 flex flex-col gap-1.5 pointer-events-none max-w-md">
        <MapSearchBar
          onSelectLocation={(coords, label) => {
            if (onLocationSearch) {
              onLocationSearch(coords, label);
            } else {
              onMapClick(coords);
            }
          }}
          onDropdownOpenChange={setSearchOverlayOpen}
        />

        {!searchOverlayOpen && (
          <div className="bg-white/95 border border-[#D8D3C8] rounded-md px-2.5 py-1 shadow-xs flex items-center gap-1.5 text-[11px] text-[#52504A] w-fit max-w-full">
            <Crosshair className="w-3 h-3 text-[#52504A] shrink-0" aria-hidden="true" />
            <span className="leading-snug">
              Click any point on the map. Results describe the surrounding ~50-60 km grid cell.
            </span>
          </div>
        )}

        {/* Non-blocking Tile Notice */}
        {mapNotice && (
          <div className="pointer-events-auto max-w-sm" role="status">
            <div className="bg-white border border-[#D8C7C3] rounded-md px-3 py-2 shadow-sm flex items-center justify-between gap-2 text-xs text-[#7D2B19]">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#C8472B] shrink-0" aria-hidden="true" />
                <span>{mapNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setMapNotice(null)}
                className="text-[#52504A] hover:text-[#1A1A1A] p-1"
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom-left Google-Maps-style Basemap Switcher */}
      <div className="absolute bottom-9 left-2.5 z-10 flex flex-col gap-1.5">
        <div
          role="group"
          aria-label="Basemap switcher"
          className="inline-flex items-center bg-white/95 border border-[#D8D3C8] rounded-md p-0.5 shadow-sm w-fit"
        >
          <button
            type="button"
            onClick={() => setBasemap('map')}
            aria-pressed={basemap === 'map'}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              basemap === 'map'
                ? 'bg-[#1A1A1A] text-white font-semibold'
                : 'text-[#1A1A1A] hover:bg-[#F2EEE6] font-medium'
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => setBasemap('satellite')}
            aria-pressed={basemap === 'satellite'}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              basemap === 'satellite'
                ? 'bg-[#1A1A1A] text-white font-semibold'
                : 'text-[#1A1A1A] hover:bg-[#F2EEE6] font-medium'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* NASA GIBS Overlays Switcher Control */}
      <div className="absolute bottom-9 right-12 z-10">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayerMenu((prev) => !prev)}
            aria-expanded={showLayerMenu}
            aria-label="Switch NASA GIBS overlays"
            className="px-3 py-1.5 rounded-md bg-white/95 hover:bg-[#F2EEE6] text-[#1A1A1A] border border-[#D8D3C8] shadow-sm transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#52504A]" aria-hidden="true" />
            <span className="hidden sm:inline">Map layers</span>
          </button>

          {showLayerMenu && (
            <div className="absolute bottom-10 right-0 w-64 bg-white border border-[#D8D3C8] rounded-md p-1.5 shadow-lg space-y-1">
              <div className="text-xs font-medium text-[#52504A] px-2.5 py-1 border-b border-[#E2DDD3]">
                NASA GIBS imagery overlays
              </div>
              {NASA_GIBS_OVERLAYS.map((overlay) => (
                <button
                  key={overlay.id}
                  type="button"
                  onClick={() => {
                    setActiveOverlayId(overlay.id);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    activeOverlayId === overlay.id
                      ? 'bg-[#EAE5DA] text-[#1A1A1A] font-semibold'
                      : 'text-[#52504A] hover:bg-[#F2EEE6] hover:text-[#1A1A1A]'
                  }`}
                >
                  <span>{overlay.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
