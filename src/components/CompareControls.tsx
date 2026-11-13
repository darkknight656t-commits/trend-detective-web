import React from 'react';
import { ArrowLeftRight, Trash2 } from 'lucide-react';
import { AnalysisResponse } from '../types/api.ts';
import { formatDecadalRate, formatRateDifference } from '../lib/format.ts';

interface CompareControlsProps {
  hasA: boolean;
  hasB: boolean;
  dataA?: AnalysisResponse | null;
  dataB?: AnalysisResponse | null;
  onSwap: () => void;
  onClear: () => void;
}

export const CompareControls: React.FC<CompareControlsProps> = ({
  hasA,
  hasB,
  dataA,
  dataB,
  onSwap,
  onClear,
}) => {
  return (
    <div className="pb-4 border-b border-[#E2DDD3] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-serif text-base font-semibold text-[#1A1A1A]">
            Compare locations
          </span>
          <span className="text-xs text-[#6B6860]">
            Location A: {hasA ? 'selected' : 'click map'} · Location B:{' '}
            {hasB ? 'selected' : 'click map'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSwap}
            disabled={!hasA || !hasB}
            aria-label="Swap Location A and Location B"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#FAF8F4] hover:bg-[#F2EEE6] disabled:opacity-40 text-[#1A1A1A] border border-[#D8D3C8] transition-colors whitespace-nowrap"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#52504A]" aria-hidden="true" />
            <span>Swap A/B</span>
          </button>
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear compare locations"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#FAF8F4] hover:bg-[#F5EBE8] text-[#9E2F1A] border border-[#E2C9C2] transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Compact Difference Line (Only rendered when both A and B have valid slopes) */}
      {dataA &&
        dataB &&
        (() => {
          const tempA = dataA.temperature?.sen_slope_per_decade;
          const tempB = dataB.temperature?.sen_slope_per_decade;
          const hasTempBoth =
            typeof tempA === 'number' &&
            Number.isFinite(tempA) &&
            typeof tempB === 'number' &&
            Number.isFinite(tempB);

          const precipA = dataA.precipitation?.sen_slope_per_decade;
          const precipB = dataB.precipitation?.sen_slope_per_decade;
          const hasPrecipBoth =
            typeof precipA === 'number' &&
            Number.isFinite(precipA) &&
            typeof precipB === 'number' &&
            Number.isFinite(precipB);

          if (!hasTempBoth && !hasPrecipBoth) return null;

          const tempUnit = dataA.temperature?.unit ?? '°C';
          const precipUnit = dataA.precipitation?.unit ?? 'mm/day';

          return (
            <div className="pt-3 border-t border-[#E2DDD3] space-y-1.5 text-xs">
              {hasTempBoth && (
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 tabular-nums">
                  <span className="text-[#52504A] font-medium">
                    Air temperature at 2 m (T2M)
                  </span>
                  <div className="text-[#1A1A1A]">
                    <span className="font-semibold text-[#C8472B]">
                      A {formatDecadalRate(tempA, tempUnit)}
                    </span>
                    <span className="text-[#6B6860] mx-1.5">·</span>
                    <span className="font-semibold text-[#C8472B]">
                      B {formatDecadalRate(tempB, tempUnit)}
                    </span>
                    <span className="text-[#52504A] ml-2">
                      (B − A: {formatRateDifference(tempA, tempB, tempUnit)})
                    </span>
                  </div>
                </div>
              )}

              {hasPrecipBoth && (
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 tabular-nums">
                  <span className="text-[#52504A] font-medium">
                    Precipitation (PRECTOTCORR, bias-corrected)
                  </span>
                  <div className="text-[#1A1A1A]">
                    <span className="font-semibold text-[#2F6C9F]">
                      A {formatDecadalRate(precipA, precipUnit)}
                    </span>
                    <span className="text-[#6B6860] mx-1.5">·</span>
                    <span className="font-semibold text-[#2F6C9F]">
                      B {formatDecadalRate(precipB, precipUnit)}
                    </span>
                    <span className="text-[#52504A] ml-2">
                      (B − A: {formatRateDifference(precipA, precipB, precipUnit)})
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      <p className="text-xs text-[#6B6860]">
        Clicking the map sets Location A first, then Location B. Subsequent clicks update Location B.
      </p>
    </div>
  );
};
