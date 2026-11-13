/**
 * Keyless, free map styles and overlays for Trend Detective (MapLibre GL JS).
 * - Default "Map" basemap: OpenFreeMap Liberty (unmodified original look).
 * - "Satellite" basemap: Esri World Imagery + World Boundaries and Places toggled via setLayoutProperty.
 * - "Map layers": NASA GIBS WMTS overlays layered cleanly above the active basemap.
 */

export const LIBERTY_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export const ESRI_SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const ESRI_SATELLITE_ATTRIBUTION = 'Imagery © Esri, Maxar, Earthstar Geographics';

export const ESRI_LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
export const ESRI_LABELS_ATTRIBUTION = 'Labels © Esri';

export function toResilientEsriUrl(url: string): string {
  return url.replace(/^https:\/\//, 'esri-retry://');
}

export interface MapOverlayConfig {
  id: string;
  name: string;
  attribution: string;
  tileUrl: string;
  tileSize: number;
  maxzoom: number;
  opacity: number;
}

export const NASA_GIBS_OVERLAYS: MapOverlayConfig[] = [
  {
    id: 'base-only',
    name: 'No overlay (Base map only)',
    attribution: '',
    tileUrl: '',
    tileSize: 256,
    maxzoom: 22,
    opacity: 0,
  },
  {
    id: 'nasa-blue-marble',
    name: 'NASA GIBS (Blue Marble)',
    attribution: 'NASA GIBS / NASA Earthdata (Blue Marble)',
    tileUrl:
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
    tileSize: 256,
    maxzoom: 8,
    opacity: 0.78,
  },
  {
    id: 'nasa-modis-terra',
    name: 'NASA GIBS (MODIS Terra Corrected)',
    attribution: 'NASA GIBS / NASA Earthdata (MODIS Terra)',
    tileUrl:
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
    tileSize: 256,
    maxzoom: 9,
    opacity: 0.78,
  },
];
