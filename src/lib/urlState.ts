/**
 * URL state management via URLSearchParams for shareable deep links.
 * Supports single location (?lat=..&lon=..) and compare mode (?a=lat,lon&b=lat,lon).
 */

import { LocationCoordinates } from '../types/api.ts';
import { roundCoord, normalizeLongitude } from './format.ts';

export interface ParsedUrlState {
  mode: 'single' | 'compare' | 'empty';
  singleLocation?: LocationCoordinates;
  compareA?: LocationCoordinates;
  compareB?: LocationCoordinates;
}

function parseCoordsPair(val: string | null): LocationCoordinates | null {
  if (!val) return null;
  const parts = val.split(',').map((p) => Number.parseFloat(p.trim()));
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    const lat = roundCoord(parts[0]);
    const lon = roundCoord(normalizeLongitude(parts[1]));
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }
  return null;
}

/**
 * Parses the current window search parameters.
 */
export function parseUrlState(search = window.location.search): ParsedUrlState {
  const params = new URLSearchParams(search);

  // Check compare mode first (?a=lat,lon&b=lat,lon)
  const aParam = params.get('a');
  const bParam = params.get('b');
  if (aParam || bParam) {
    const compareA = parseCoordsPair(aParam);
    const compareB = parseCoordsPair(bParam);
    if (compareA || compareB) {
      return {
        mode: 'compare',
        compareA: compareA ?? undefined,
        compareB: compareB ?? undefined,
      };
    }
  }

  // Check single mode (?lat=..&lon=..)
  const latStr = params.get('lat');
  const lonStr = params.get('lon');
  if (latStr && lonStr) {
    const lat = Number.parseFloat(latStr);
    const lon = Number.parseFloat(lonStr);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      const roundedLat = roundCoord(lat);
      const roundedLon = roundCoord(normalizeLongitude(lon));
      if (roundedLat >= -90 && roundedLat <= 90 && roundedLon >= -180 && roundedLon <= 180) {
        return {
          mode: 'single',
          singleLocation: { lat: roundedLat, lon: roundedLon },
        };
      }
    }
  }

  return { mode: 'empty' };
}

/**
 * Serializes state and updates URL via history.replaceState without reloading the page.
 */
export function updateUrlState(
  mode: 'single' | 'compare',
  coords: {
    single?: LocationCoordinates | null;
    compareA?: LocationCoordinates | null;
    compareB?: LocationCoordinates | null;
  }
): void {
  const url = new URL(window.location.href);
  const params = url.searchParams;

  // Clear existing coordinate params
  params.delete('lat');
  params.delete('lon');
  params.delete('a');
  params.delete('b');

  if (mode === 'single' && coords.single) {
    params.set('lat', coords.single.lat.toFixed(2));
    params.set('lon', coords.single.lon.toFixed(2));
  } else if (mode === 'compare') {
    if (coords.compareA) {
      params.set('a', `${coords.compareA.lat.toFixed(2)},${coords.compareA.lon.toFixed(2)}`);
    }
    if (coords.compareB) {
      params.set('b', `${coords.compareB.lat.toFixed(2)},${coords.compareB.lon.toFixed(2)}`);
    }
  }

  const newUrl = `${url.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
  window.history.replaceState({}, '', newUrl);
}

/**
 * Builds a shareable URL string.
 */
export function getShareableUrl(
  mode: 'single' | 'compare',
  coords: {
    single?: LocationCoordinates | null;
    compareA?: LocationCoordinates | null;
    compareB?: LocationCoordinates | null;
  }
): string {
  const url = new URL(window.location.href);
  const params = new URLSearchParams();

  if (mode === 'single' && coords.single) {
    params.set('lat', coords.single.lat.toFixed(2));
    params.set('lon', coords.single.lon.toFixed(2));
  } else if (mode === 'compare') {
    if (coords.compareA) {
      params.set('a', `${coords.compareA.lat.toFixed(2)},${coords.compareA.lon.toFixed(2)}`);
    }
    if (coords.compareB) {
      params.set('b', `${coords.compareB.lat.toFixed(2)},${coords.compareB.lon.toFixed(2)}`);
    }
  }

  return `${url.origin}${url.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
}
