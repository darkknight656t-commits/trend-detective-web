/**
 * Backend API Contract for Trend Detective (Frozen Specification)
 * All types strictly align with NASA POWER MERRA-2 trend analysis responses.
 */

export type TrendDirection = 'increasing' | 'decreasing' | 'no trend';
export type ConfidenceLevel = 'Strong' | 'Weak' | 'No significant trend';

export interface LocationCoordinates {
  lat: number;
  lon: number;
}

export interface GridInfo {
  approx_size_km: string;
  note: string;
  cell_lat?: number | null;
  cell_lon?: number | null;
}

export interface SeriesStats {
  unit: string;
  values: number[];
  n_years: number;
  first_year: number;
  last_year: number;
  trend_direction: TrendDirection;
  p_raw: number;
  p_adj: number;
  sen_slope_per_year: number;
  sen_slope_per_decade: number;
  intercept: number;
  confidence: ConfidenceLevel;
  pettitt_year?: number | null;
  pettitt_p_raw?: number | null;
  pettitt_p_adj?: number | null;
  change_point_significant: boolean;
  mean_before?: number | null;
  mean_after?: number | null;
}

export interface CorrelationStats {
  spearman_raw: number;
  p_raw: number;
  spearman_detrended: number;
  p_detrended_raw: number;
  p_detrended_adj: number;
}

export interface MetaInfo {
  alpha: number;
  fdr: string;
  trend_test: string;
  source: string;
}

export interface AnalysisResponse {
  location: LocationCoordinates;
  grid: GridInfo;
  cached: boolean;
  fetched_at: string;
  years: number[];
  temperature: SeriesStats;
  precipitation: SeriesStats;
  correlation: CorrelationStats;
  summary: string[];
  meta: MetaInfo;
}

export type ApiErrorCode =
  | 'INSUFFICIENT_DATA'
  | 'POWER_UNAVAILABLE'
  | 'POWER_EMPTY'
  | 'INVALID_COORDINATES'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'GENERIC_ERROR';

export interface ApiErrorPayload {
  error: {
    code: ApiErrorCode | string;
    message: string;
  };
}
