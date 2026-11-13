/**
 * Validation tests configuration for methodology verification.
 * Numeric fields remain null until empirical statistical test bench numbers are supplied.
 */

export interface ValidationTestItem {
  id: string;
  title: string;
  description: string;
  expected: string;
  recoveredRate: number | null;
  recoveredYear: number | null;
  recoveredPValue: number | null;
  status: 'passed' | 'pending' | 'evaluating';
  notes: string;
}

export const VALIDATION_TESTS: ValidationTestItem[] = [
  {
    id: 'synthetic-trend',
    title: 'Synthetic Series with Known Linear Trend',
    description:
      'Autoregressive AR(1) noise with an injected linear trend of 0.030 °C/year (0.30 °C/decade) tested across 1,000 Monte Carlo realizations using the Hamed-Rao modified Mann-Kendall test.',
    expected: 'Recovered Sen slope of 0.30 ± 0.03 °C/decade with empirical coverage >= 95%.',
    recoveredRate: null, // Left as null: displays "Result pending"
    recoveredYear: null,
    recoveredPValue: null,
    status: 'pending',
    notes: 'Awaiting official test-bench rerun with final package dependencies.',
  },
  {
    id: 'synthetic-step',
    title: 'Synthetic Series with Known Step Shift',
    description:
      'Simulated climate timeseries with an abrupt +1.0 °C step shift at index year 2000, evaluated using Pettitt rank change-point test under serial correlation.',
    expected: 'Change point recovered at year 2000 ± 1 year with p_adj < 0.01.',
    recoveredRate: null,
    recoveredYear: null, // Left as null: displays "Result pending"
    recoveredPValue: null,
    status: 'pending',
    notes: 'Validates sensitivity to abrupt observation platform shifts versus gradual trends.',
  },
  {
    id: 'arctic-benchmark',
    title: 'Real-World Benchmark (Arctic Amplification)',
    description:
      'Comparison of MERRA-2 Svalbard / Barents Sea warming rate against published peer-reviewed climate reports for high-latitude amplification from 1981 onwards.',
    expected: 'Decadal warming rate between +0.65 and +0.85 °C/decade with p_adj < 0.001.',
    recoveredRate: null, // Left as null: displays "Result pending"
    recoveredYear: null,
    recoveredPValue: null,
    status: 'pending',
    notes: 'Reference: Arctic Report Card / IPCC AR6 Regional Climate Projections.',
  },
];
