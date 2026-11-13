/**
 * Pure formatting utilities adhering strictly to scientific data presentation rules.
 * No data values are altered or invented.
 */

/**
 * Normalizes a longitude coordinate to the valid range [-180, 180].
 */
export function normalizeLongitude(lon: number): number {
  let normalized = ((lon + 180) % 360);
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized - 180;
}

/**
 * Rounds a coordinate to 2 decimal places as specified in the API contract.
 */
export function roundCoord(coord: number): number {
  return Math.round(coord * 100) / 100;
}

/**
 * Formats a p-value for scientific publication standards:
 * - p < 0.001 when below 0.001
 * - p = 0.002 otherwise (up to 3 or 4 decimal places)
 */
export function formatPValue(p: number | null | undefined): string {
  if (p === null || p === undefined || Number.isNaN(p)) {
    return 'N/A';
  }
  if (p < 0.001) {
    return 'p < 0.001';
  }
  return `p = ${p.toFixed(3)}`;
}

/**
 * Formats rate of change per decade with signed prefix and unit.
 * Example: "+0.31 °C / decade", "-0.05 mm/day / decade"
 */
export function formatDecadalRate(rate: number | null | undefined, unit: string): string {
  if (rate === null || rate === undefined || Number.isNaN(rate)) {
    return 'N/A';
  }
  const sign = rate > 0 ? '+' : '';
  return `${sign}${rate.toFixed(2)} ${unit} / decade`;
}

/**
 * Formats decadal rate difference for compare mode (only subtracting displayed numbers)
 */
export function formatRateDifference(
  rateA: number | null | undefined,
  rateB: number | null | undefined,
  unit: string
): string {
  if (
    rateA === null ||
    rateA === undefined ||
    !Number.isFinite(rateA) ||
    rateB === null ||
    rateB === undefined ||
    !Number.isFinite(rateB)
  ) {
    return 'N/A';
  }
  const displayedA = Number(rateA.toFixed(2));
  const displayedB = Number(rateB.toFixed(2));
  const diff = displayedB - displayedA;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(2)} ${unit}/decade`;
}

/**
 * Formats general numeric measurement with unit.
 */
export function formatMeasurement(value: number | null | undefined, unit?: string): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'N/A';
  }
  return unit ? `${value.toFixed(2)} ${unit}` : value.toFixed(2);
}

/**
 * Derives neutral correlation strength descriptor strictly from thresholds on |spearman_detrended|:
 * < 0.2: "negligible"
 * 0.2 to 0.4: "weak"
 * 0.4 to 0.6: "moderate"
 * >= 0.6: "strong"
 * Appends "(not statistically significant)" when p_detrended_adj >= 0.05
 */
export function getCorrelationDescriptor(
  spearmanDetrended: number,
  pDetrendedAdj: number
): { strength: string; isSignificant: boolean; fullLabel: string } {
  if (!Number.isFinite(spearmanDetrended) || !Number.isFinite(pDetrendedAdj)) {
    return {
      strength: 'unavailable',
      isSignificant: false,
      fullLabel: 'Unavailable',
    };
  }
  const absVal = Math.abs(spearmanDetrended);
  let strength = 'negligible';
  if (absVal >= 0.6) {
    strength = 'strong';
  } else if (absVal >= 0.4) {
    strength = 'moderate';
  } else if (absVal >= 0.2) {
    strength = 'weak';
  }

  const isSignificant = pDetrendedAdj < 0.05;
  const fullLabel = isSignificant
    ? `${strength.charAt(0).toUpperCase() + strength.slice(1)} correlation`
    : `${strength.charAt(0).toUpperCase() + strength.slice(1)} (not statistically significant)`;

  return { strength, isSignificant, fullLabel };
}

/**
 * Formats an ISO date string into a clean, human-readable UTC timestamp.
 */
export function formatFetchedAt(isoString?: string | null): string {
  if (!isoString) return 'Recent';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) {
    return isoString;
  }
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}
