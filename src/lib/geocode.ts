import { roundCoord } from './format.ts';

export interface GeocodedPlace {
  id: string;
  label: string;
  subtitle: string;
  lat: number;
  lon: number;
}

export type CoordinateParseResult =
  | { status: 'valid'; lat: number; lon: number }
  | { status: 'invalid'; error: string }
  | { status: 'not_coords' };

/**
 * Parses coordinate strings such as:
 * - "-3.10, -60.00"
 * - "78.2 15.6"
 * - "3.10°S, 60.00°W"
 * - "51.5074° N, 0.1278° W"
 * - "S 3.1, W 60.0"
 */
export function parseCoordinateInput(raw: string): CoordinateParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { status: 'not_coords' };

  // Strip degree symbols and normalize whitespace around commas
  const cleaned = trimmed.replace(/°/g, ' ').replace(/\s+/g, ' ').trim();

  // Pattern for two coordinate components separated by comma or whitespace
  // Each token can have optional leading/trailing N/S/E/W and signed decimal number
  const tokenPattern = '([NSnsEeWw]?\\s*[+-]?\\d+(?:\\.\\d+)?\\s*[NSnsEeWw]?)';
  const pairRegex = new RegExp(`^${tokenPattern}\\s*(?:,|\\s)\\s*${tokenPattern}$`);
  const match = cleaned.match(pairRegex);

  if (!match) {
    return { status: 'not_coords' };
  }

  const parseToken = (
    token: string
  ): { value: number; axis: 'lat' | 'lon' | null } | null => {
    const m = token.trim().match(/^([NSnsEeWw])?\s*([+-]?\d+(?:\.\d+)?)\s*([NSnsEeWw])?$/);
    if (!m) return null;
    const prefixDir = m[1]?.toUpperCase();
    const num = Number(m[2]);
    const suffixDir = m[3]?.toUpperCase();
    if (!Number.isFinite(num) || (prefixDir && suffixDir)) return null;

    const dir = prefixDir || suffixDir || null;
    let signed = num;
    let axis: 'lat' | 'lon' | null = null;

    if (dir === 'N' || dir === 'S') {
      axis = 'lat';
      signed = dir === 'S' ? -Math.abs(num) : Math.abs(num);
    } else if (dir === 'E' || dir === 'W') {
      axis = 'lon';
      signed = dir === 'W' ? -Math.abs(num) : Math.abs(num);
    }

    return { value: signed, axis };
  };

  const first = parseToken(match[1]);
  const second = parseToken(match[2]);
  if (!first || !second) return { status: 'not_coords' };

  // Reject contradictory or duplicated axes like "10N, 20S"
  if (first.axis && second.axis && first.axis === second.axis) {
    return {
      status: 'invalid',
      error: 'Please provide one latitude (N/S) and one longitude (E/W).',
    };
  }

  let lat = first.value;
  let lon = second.value;
  if (first.axis === 'lon' || second.axis === 'lat') {
    lat = second.value;
    lon = first.value;
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return {
      status: 'invalid',
      error: 'Coordinates must be within -90° to 90° latitude and -180° to 180° longitude.',
    };
  }

  return {
    status: 'valid',
    lat: roundCoord(lat),
    lon: roundCoord(lon),
  };
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export function formatPhotonFeature(feature: PhotonFeature, idx: number): GeocodedPlace | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [rawLon, rawLat] = coords;
  if (!Number.isFinite(rawLat) || !Number.isFinite(rawLon)) return null;

  const props = feature.properties || {};
  const primary = props.name || props.city || props.state || props.country;
  if (!primary) return null;

  const contextParts: string[] = [];
  for (const part of [props.city, props.state, props.country]) {
    if (part && part !== primary && !contextParts.includes(part)) {
      contextParts.push(part);
    }
  }

  return {
    id: `${props.osm_type || 'f'}-${props.osm_id || idx}`,
    label: primary,
    subtitle: contextParts.join(', '),
    lat: roundCoord(rawLat),
    lon: roundCoord(rawLon),
  };
}

interface NominatimItem {
  place_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
}

/**
 * Keyless place-name search using OpenStreetMap Photon (with Nominatim fallback).
 * Never invents coordinates; throws on network failure so the UI can show an honest notice.
 */
export async function searchLocationName(
  query: string,
  signal?: AbortSignal
): Promise<GeocodedPlace[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=5&lang=en`;
    const res = await fetch(photonUrl, { signal });
    if (res.ok) {
      const json = (await res.json()) as { features?: PhotonFeature[] };
      const features = Array.isArray(json?.features) ? json.features : [];
      const places = features
        .map((f, idx) => formatPhotonFeature(f, idx))
        .filter((p): p is GeocodedPlace => p !== null);
      if (places.length > 0 || res.ok) {
        return places;
      }
    }
  } catch (err) {
    if (signal?.aborted) throw err;
    // Fall through to Nominatim fallback below
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=en&q=${encodeURIComponent(trimmed)}`;
  const fallbackRes = await fetch(nominatimUrl, { signal });
  if (!fallbackRes.ok) {
    throw new Error(`Geocoder HTTP ${fallbackRes.status}`);
  }
  const items = (await fallbackRes.json()) as NominatimItem[];
  if (!Array.isArray(items)) return [];

  return items
    .map((item, idx): GeocodedPlace | null => {
      const lat = Number(item.lat);
      const lon = Number(item.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !item.display_name) {
        return null;
      }
      const parts = item.display_name.split(',').map((s) => s.trim());
      return {
        id: `nom-${item.place_id || idx}`,
        label: parts[0] || item.display_name,
        subtitle: parts.slice(1, 4).join(', '),
        lat: roundCoord(lat),
        lon: roundCoord(lon),
      };
    })
    .filter((p): p is GeocodedPlace => p !== null);
}

export interface GeolocationNotice {
  text: string;
  isCoarse: boolean;
}

/**
 * Formats an honest geolocation status message including the browser-reported accuracy radius.
 * Desktop browsers without GPS hardware often fall back to coarse IP estimation (> 1 km).
 */
export function formatGeolocationNotice(
  lat: number,
  lon: number,
  accuracyMeters?: number | null
): GeolocationNotice {
  const coordsText = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
  if (typeof accuracyMeters === 'number' && Number.isFinite(accuracyMeters) && accuracyMeters > 0) {
    if (accuracyMeters > 1000) {
      const km = Math.max(1, Math.round(accuracyMeters / 1000));
      return {
        isCoarse: true,
        text: `Approximate browser location: ${coordsText} (±${km} km). Desktop/VPN IP estimates can be offset — search a place or click the map to refine.`,
      };
    }
    const meters = Math.max(1, Math.round(accuracyMeters));
    return {
      isCoarse: false,
      text: `Located at ${coordsText} (±${meters} m).`,
    };
  }

  return {
    isCoarse: false,
    text: `Located at ${coordsText}.`,
  };
}
