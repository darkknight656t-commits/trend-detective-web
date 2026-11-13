/**
 * API client for NASA POWER / MERRA-2 Trend Detective backend.
 * Enforces 70s timeout, cancellation via AbortController, coordinate normalization,
 * silent Render wake-up ping, safe env variable reading, and honest error mapping.
 */

import { AnalysisResponse, ApiErrorCode } from '../types/api.ts';
import { DEFAULT_API_BASE_URL } from '../config/api.ts';
import { roundCoord, normalizeLongitude } from './format.ts';
import sampleSahel from '../fixtures/sample_sahel.json';
import sampleArctic from '../fixtures/sample_arctic.json';
import sampleAmazon from '../fixtures/sample_amazon.json';

const API_TIMEOUT_MS = 70000;

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}

export const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  INSUFFICIENT_DATA:
    "This location doesn't have enough complete years of data for a reliable test.",
  POWER_UNAVAILABLE:
    "NASA's data service didn't respond. We don't show estimated numbers, so please try again shortly.",
  POWER_EMPTY:
    'NASA returned no data for this spot (often open ocean or polar edge cases). Try a nearby land point.',
  INVALID_COORDINATES:
    "That location isn't valid. Click a point on the map.",
  RATE_LIMITED:
    'Too many requests. Please wait a few seconds and try again.',
  TIMEOUT:
    "Couldn't reach the server. No data was shown.",
  NETWORK_ERROR:
    "Couldn't reach the server. No data was shown.",
  GENERIC_ERROR:
    "Couldn't reach the server. No data was shown.",
};

const KNOWN_SERVER_ERROR_CODES = new Set<ApiErrorCode>([
  'INSUFFICIENT_DATA',
  'POWER_UNAVAILABLE',
  'POWER_EMPTY',
  'INVALID_COORDINATES',
  'RATE_LIMITED',
]);

/**
 * Safely checks if fixture mode is enabled.
 * Treats a missing or non-'true' VITE_USE_FIXTURES as false.
 */
export function isFixtureModeEnabled(): boolean {
  try {
    const val = import.meta.env?.VITE_USE_FIXTURES;
    return typeof val === 'string' && val.trim().toLowerCase() === 'true';
  } catch {
    return false;
  }
}

/**
 * Reads VITE_API_BASE_URL from import.meta.env, falling back to DEFAULT_API_BASE_URL
 * if missing or empty, and strips any trailing slash.
 */
export function getApiBaseUrl(): string {
  try {
    const envUrl = import.meta.env?.VITE_API_BASE_URL;
    const trimmed = typeof envUrl === 'string' ? envUrl.trim() : '';
    const resolved = trimmed.length > 0 ? trimmed : DEFAULT_API_BASE_URL;
    return resolved.replace(/\/+$/, '');
  } catch {
    return DEFAULT_API_BASE_URL.replace(/\/+$/, '');
  }
}

/**
 * Fires a silent, non-blocking GET {base}/health on app load to wake a sleeping
 * Render free-tier instance. Result and errors are intentionally ignored.
 */
export function wakeUpBackend(): void {
  if (isFixtureModeEnabled()) return;
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return;

  try {
    void fetch(`${baseUrl}/health`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
    }).catch(() => {
      // Intentionally ignored — silent wake-up only
    });
  } catch {
    // Intentionally ignored
  }
}

/**
 * Fetches trend analysis for a given latitude and longitude.
 */
export async function fetchTrendAnalysis(
  rawLat: number,
  rawLon: number,
  signal?: AbortSignal
): Promise<AnalysisResponse> {
  const lat = roundCoord(rawLat);
  const lon = roundCoord(normalizeLongitude(rawLon));

  if (
    Number.isNaN(lat) ||
    Number.isNaN(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    const error: ApiError = {
      code: 'INVALID_COORDINATES',
      message: ERROR_MESSAGES.INVALID_COORDINATES,
    };
    throw error;
  }

  // Offline fixture mode for development (strictly off unless VITE_USE_FIXTURES === 'true')
  if (isFixtureModeEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const fixtures: AnalysisResponse[] = [
      sampleSahel as AnalysisResponse,
      sampleArctic as AnalysisResponse,
      sampleAmazon as AnalysisResponse,
    ];

    let closest = fixtures[0];
    let minDistance = Number.POSITIVE_INFINITY;

    for (const fix of fixtures) {
      const dLat = fix.location.lat - lat;
      const dLon = fix.location.lon - lon;
      const dist = dLat * dLat + dLon * dLon;
      if (dist < minDistance) {
        minDistance = dist;
        closest = fix;
      }
    }

    return {
      ...closest,
      location: { lat, lon },
    };
  }

  const baseUrl = getApiBaseUrl();

  // If VITE_API_BASE_URL is missing, honestly report that the server cannot be reached
  if (!baseUrl) {
    const error: ApiError = {
      code: 'NETWORK_ERROR',
      message: ERROR_MESSAGES.NETWORK_ERROR,
    };
    throw error;
  }

  const url = `${baseUrl}/analyze?lat=${lat}&lon=${lon}`;

  const timeoutController = new AbortController();
  const timer = setTimeout(() => {
    timeoutController.abort();
  }, API_TIMEOUT_MS);

  const onCallerAbort = () => timeoutController.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      throw new DOMException('Aborted', 'AbortError');
    }
    signal.addEventListener('abort', onCallerAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      let errorCode: ApiErrorCode = 'GENERIC_ERROR';

      try {
        const errorJson: unknown = await response.json();
        if (
          errorJson &&
          typeof errorJson === 'object' &&
          'error' in errorJson &&
          errorJson.error &&
          typeof errorJson.error === 'object' &&
          'code' in errorJson.error &&
          typeof errorJson.error.code === 'string'
        ) {
          const parsedCode = errorJson.error.code as ApiErrorCode;
          if (KNOWN_SERVER_ERROR_CODES.has(parsedCode)) {
            errorCode = parsedCode;
          }
        }
      } catch {
        // Non-JSON response: keep GENERIC_ERROR ("Couldn't reach the server. No data was shown.")
        errorCode = 'GENERIC_ERROR';
      }

      const error: ApiError = {
        code: errorCode,
        message: ERROR_MESSAGES[errorCode],
      };
      throw error;
    }

    const data: AnalysisResponse = await response.json();
    return data;
  } catch (err: unknown) {
    if (signal?.aborted) {
      throw err;
    }

    if (timeoutController.signal.aborted) {
      const error: ApiError = {
        code: 'TIMEOUT',
        message: ERROR_MESSAGES.TIMEOUT,
      };
      throw error;
    }

    if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
      throw err;
    }

    const error: ApiError = {
      code: 'NETWORK_ERROR',
      message: ERROR_MESSAGES.NETWORK_ERROR,
    };
    throw error;
  } finally {
    clearTimeout(timer);
    if (signal) {
      signal.removeEventListener('abort', onCallerAbort);
    }
  }
}
