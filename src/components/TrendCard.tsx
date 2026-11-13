import React from 'react';
import { SeriesStats } from '../types/api.ts';
import { formatPValue, formatDecadalRate } from '../lib/format.ts';
import { Info } from 'lucide-react';
import { ConfidenceBadge } from './ConfidenceBadge.tsx';

interface TrendCardProps {
  title: string;
  variableName: 'Temperature' | 'Precipitation';
  stats: SeriesStats;
  themeColor: 'amber' | 'cyan';
}

const isValidNum = (val: unknown): val is number =>
  typeof val === 'number' && !Number.isNaN(val);

export const TrendCard: React.FC<TrendCardProps> = ({
  title,
  variableName,
  stats,
  themeColor,
}) => {
  if (!stats) return null;

  const isTemp = themeColor === 'amber';
  const accentHex = isTemp ? '#C8472B' : '#2F6C9F';

  const hasSlope = isValidNum(stats.sen_slope_per_decade) && Boolean(stats.unit);
  const hasPAdj = isValidNum(stats.p_adj);
  const hasPRaw = isValidNum(stats.p_raw);
  const hasPeriod =
    isValidNum(stats.first_year) &&
    isValidNum(stats.last_year) &&
    isValidNum(stats.n_years);

  const supportPhrase =
    stats.confidence === 'Strong'
      ? 'strong statistical support'
      : stats.confidence === 'Weak'
      ? 'weak statistical support'
      : 'no statistically significant trend';

  const directionWord =
    stats.trend_direction === 'increasing'
      ? 'Increasing'
      : stats.trend_direction === 'decreasing'
      ? 'Decreasing'
      : 'No significant trend';

  const formattedSlope = hasSlope
    ? formatDecadalRate(stats.sen_slope_per_decade, stats.unit).replace(' / decade', ' per decade')
    : null;

  const detailParts: string[] = [];
  if (hasPAdj) {
    detailParts.push(`adjusted ${formatPValue(stats.p_adj)}`);
  }
  if (hasPeriod) {
    detailParts.push(`${stats.first_year}–${stats.last_year}, ${stats.n_years} yrs`);
  }

  return (
    <div className="pt-6 border-t border-[#E2DDD3] space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-[#1A1A1A]">{title}</h4>
        {stats.confidence && (
          <ConfidenceBadge variableName={variableName} confidence={stats.confidence} />
        )}
      </div>

      {formattedSlope && (
        <div
          className="font-serif text-3xl sm:text-4xl font-semibold tabular-nums tracking-tight"
          style={{ color: accentHex }}
        >
          {formattedSlope}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 text-sm text-[#52504A] leading-relaxed">
        <span>
          {directionWord}, {supportPhrase}
          {detailParts.length > 0 ? ` (${detailParts.join(' · ')})` : ''}.
        </span>
        {hasPRaw && (
          <span
            className="inline-flex items-center cursor-help text-[#6B6860] hover:text-[#1A1A1A] transition-colors"
            title={`Sen's slope estimator; Benjamini-Hochberg adjusted p-value. Raw ${formatPValue(stats.p_raw)}`}
            aria-label={`Raw ${formatPValue(stats.p_raw)}`}
          >
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
};
