import React from 'react';
import { CorrelationStats } from '../types/api.ts';
import { getCorrelationDescriptor, formatPValue } from '../lib/format.ts';

interface CorrelationCardProps {
  correlation: CorrelationStats;
}

const isValidNum = (val: unknown): val is number =>
  typeof val === 'number' && !Number.isNaN(val);

export const CorrelationCard: React.FC<CorrelationCardProps> = ({ correlation }) => {
  if (!correlation) return null;

  const hasRaw = isValidNum(correlation.spearman_raw);
  const hasDetrended = isValidNum(correlation.spearman_detrended);
  const hasDetrendedAdj = isValidNum(correlation.p_detrended_adj);

  if (!hasRaw && !hasDetrended) return null;

  const descriptor =
    hasDetrended && hasDetrendedAdj
      ? getCorrelationDescriptor(
          correlation.spearman_detrended,
          correlation.p_detrended_adj
        )
      : null;

  return (
    <section className="pt-6 border-t border-[#E2DDD3] space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-serif text-lg font-semibold text-[#1A1A1A]">
          T2M &amp; PRECTOTCORR co-movement
        </h4>
        {descriptor && (
          <span className="text-xs text-[#52504A]">{descriptor.fullLabel}</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {hasRaw && (
          <div className="flex flex-col justify-between gap-2">
            <div className="text-xs text-[#52504A]">
              Raw correlation (air temperature T2M vs precipitation PRECTOTCORR)
            </div>
            <div>
              <div className="font-serif text-2xl sm:text-3xl font-semibold tabular-nums text-[#1A1A1A]">
                {correlation.spearman_raw > 0 ? '+' : ''}
                {correlation.spearman_raw.toFixed(2)}
              </div>
              {isValidNum(correlation.p_raw) && (
                <div className="text-xs text-[#6B6860] tabular-nums mt-0.5">
                  Spearman raw ({formatPValue(correlation.p_raw)})
                </div>
              )}
            </div>
          </div>
        )}

        {hasDetrended && (
          <div className="flex flex-col justify-between gap-2">
            <div className="text-xs text-[#52504A]">
              After removing each series&apos; own trend
            </div>
            <div>
              <div className="font-serif text-2xl sm:text-3xl font-semibold tabular-nums text-[#1A1A1A]">
                {correlation.spearman_detrended > 0 ? '+' : ''}
                {correlation.spearman_detrended.toFixed(2)}
              </div>
              {hasDetrendedAdj && (
                <div className="text-xs text-[#6B6860] tabular-nums mt-0.5">
                  Detrended adjusted ({formatPValue(correlation.p_detrended_adj)})
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-[#6B6860] leading-relaxed">
        Two series that both trend can look related even when they are not. The second number
        removes that effect. Correlation does not mean one causes the other.
      </p>
    </section>
  );
};
