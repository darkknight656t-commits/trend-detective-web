import React, { useState } from 'react';
import { AnalysisResponse } from '../types/api.ts';
import { formatFetchedAt } from '../lib/format.ts';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TrustPanelProps {
  data: AnalysisResponse;
}

const isValidNum = (val: unknown): val is number =>
  typeof val === 'number' && !Number.isNaN(val);

export const TrustPanel: React.FC<TrustPanelProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(true);

  const hasCellCenter =
    isValidNum(data.grid?.cell_lat) && isValidNum(data.grid?.cell_lon);

  return (
    <section className="pt-6 border-t border-[#E2DDD3]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full py-2 flex items-center justify-between gap-3 text-left group"
      >
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="font-serif text-base font-semibold text-[#1A1A1A] group-hover:underline">
            How to read this result
          </span>
          {typeof data.cached === 'boolean' && (
            <span className="text-xs text-[#6B6860]">
              · {data.cached ? 'cached response' : 'live compute'}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#52504A] shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#52504A] shrink-0" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div className="pt-4 space-y-4 text-xs sm:text-[13px] text-[#52504A] leading-relaxed">
          {/* 1. Grid Size & Cell Centre */}
          <div>
            <strong className="font-semibold text-[#1A1A1A] block mb-0.5">
              Spatial resolution
            </strong>
            <span>
              Each result is an average over a ~{data.grid?.approx_size_km || '50-60'} km grid
              cell ({data.grid?.note || 'MERRA-2 grid cell average, not a point measurement'}).
            </span>
            {hasCellCenter && (
              <div className="text-xs text-[#1A1A1A] tabular-nums mt-1">
                Grid cell centre: {data.grid.cell_lat!.toFixed(2)}, {data.grid.cell_lon!.toFixed(2)}
              </div>
            )}
          </div>

          {/* 2. Data Type */}
          <div>
            <strong className="font-semibold text-[#1A1A1A] block mb-0.5">
              Model &amp; observation provenance
            </strong>
            <span>
              Reanalysis data (MERRA-2): Air temperature at 2 m (T2M) and Precipitation
              (PRECTOTCORR, bias-corrected) from a numerical weather prediction model constrained
              by satellite and ground observations, not raw station readings.
            </span>
          </div>

          {/* 3. Causation */}
          <div>
            <strong className="font-semibold text-[#1A1A1A] block mb-0.5">
              Scientific integrity rule
            </strong>
            <span>
              Correlation does not imply causation. We measure statistical co-movement across
              complete annual series without claiming causality.
            </span>
          </div>

          {/* 4. Confidence Meaning */}
          <div>
            <strong className="font-semibold text-[#1A1A1A] block mb-1.5">
              Confidence scale &amp; thresholds
            </strong>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
              <div className="inline-flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <circle cx="5" cy="5" r="4" fill="#1A1A1A" />
                </svg>
                <span className="font-medium text-[#1A1A1A]">Strong:</span>
                <span>adjusted p &lt; 0.01</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <circle cx="5" cy="5" r="4" fill="none" stroke="#1A1A1A" strokeWidth="1.25" />
                  <path d="M 5 1 A 4 4 0 0 0 5 9 Z" fill="#1A1A1A" />
                </svg>
                <span className="font-medium text-[#1A1A1A]">Weak:</span>
                <span>0.01 &le; p &lt; 0.05</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <circle cx="5" cy="5" r="4" fill="none" stroke="#6B6860" strokeWidth="1.25" />
                </svg>
                <span className="font-medium text-[#1A1A1A]">No significant trend:</span>
                <span>adjusted p &ge; 0.05</span>
              </div>
            </div>
          </div>

          {/* 5. Methods */}
          <div>
            <strong className="font-semibold text-[#1A1A1A] block mb-0.5">
              Statistical rigor &amp; corrections
            </strong>
            <span>
              {data.meta?.trend_test || 'Mann-Kendall trend test with Hamed-Rao autocorrelation correction'};{' '}
              Sen's slope; Pettitt change-point test; Spearman correlation (raw and detrended);{' '}
              {data.meta?.fdr || 'Benjamini-Hochberg multiple-test correction'}
              {isValidNum(data.meta?.alpha) ? ` at alpha = ${data.meta.alpha}` : ''}.
            </span>
          </div>

          {/* 6. Source & Timestamp */}
          <div className="pt-3 border-t border-[#E2DDD3] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B6860] tabular-nums">
            <span>Source: {data.meta?.source || 'NASA POWER (MERRA-2)'}</span>
            {data.fetched_at && <span>Analyzed: {formatFetchedAt(data.fetched_at)}</span>}
          </div>
        </div>
      )}
    </section>
  );
};
