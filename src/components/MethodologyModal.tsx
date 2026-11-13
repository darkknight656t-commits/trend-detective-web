import React from 'react';
import { VALIDATION_TESTS } from '../config/validation.ts';
import { X } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="methodology-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1A1A1A]/45 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#FAF8F4] text-[#1A1A1A] border border-[#D8D3C8] rounded-md shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2DDD3] flex items-center justify-between bg-[#FAF8F4] shrink-0">
          <h2 id="methodology-title" className="font-serif text-lg sm:text-xl font-semibold text-[#1A1A1A]">
            Scientific methodology &amp; statistical validation
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close methodology modal"
            className="p-1.5 rounded-md text-[#52504A] hover:text-[#1A1A1A] hover:bg-[#F2EEE6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#1A1A1A] leading-relaxed">
          {/* 1. What this tool does */}
          <section className="space-y-2">
            <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">
              1. Purpose of Trend Detective
            </h3>
            <p className="text-[#52504A]">
              Trend Detective is an open-science computational tool designed for the NASA challenge
              &ldquo;Be An Earth System Trend Detective!&rdquo;. It allows users to point to any
              coordinate on Earth and examine multi-decadal climate trends using
              significance-tested nonparametric methods. Its goal is to provide honest, calibrated
              evidence to farmers, city planners, students, journalists, and researchers worldwide
              without black-box estimation or speculative forecasting.
            </p>
          </section>

          {/* 2. Data Provenance */}
          <section className="pt-5 border-t border-[#E2DDD3] space-y-2">
            <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">
              2. Earth science data &amp; aggregation
            </h3>
            <p className="text-[#52504A]">
              Climate variables are retrieved from the <strong className="text-[#1A1A1A]">NASA POWER</strong>{' '}
              (Prediction of Worldwide Energy Resources) API, derived from the Modern-Era
              Retrospective analysis for Research and Applications, Version 2 (<strong className="text-[#1A1A1A]">MERRA-2</strong>):
              specifically <strong className="text-[#1A1A1A]">Air temperature at 2 m (T2M)</strong> and{' '}
              <strong className="text-[#1A1A1A]">Precipitation (PRECTOTCORR, bias-corrected)</strong>.
              The spatial grid is approximately 0.5° latitude by 0.625° longitude (~50–60 km).
              Annual means are calculated exclusively from complete 12-month calendar years (the
              current ongoing incomplete year is automatically excluded).
            </p>
          </section>

          {/* 3. Statistical Methods */}
          <section className="pt-5 border-t border-[#E2DDD3] space-y-3">
            <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">
              3. Nonparametric statistical methods
            </h3>
            <div className="space-y-2.5 text-[13px] text-[#52504A]">
              <div>
                <strong className="text-[#1A1A1A]">Mann-Kendall Trend Test (Hamed-Rao):</strong> A
                rank-based test for monotonic trends modified to correct for serial autocorrelation,
                preventing false positives from cyclical multi-year oscillations.
              </div>
              <div>
                <strong className="text-[#1A1A1A]">Sen&apos;s Slope Estimator:</strong> Robust median of
                all pairwise slopes across consecutive years, unaffected by single-year outliers or
                extreme weather events.
              </div>
              <div>
                <strong className="text-[#1A1A1A]">Pettitt Change-Point Test:</strong> A nonparametric
                test that locates the single most probable year where the central distribution
                shifted from one average level to another.
              </div>
              <div>
                <strong className="text-[#1A1A1A]">Spearman Correlation (Raw &amp; Detrended):</strong>{' '}
                Evaluates monotonic co-movement between air temperature at 2 m (T2M) and
                bias-corrected precipitation (PRECTOTCORR), isolating genuine year-to-year coupling
                from shared long-term trends.
              </div>
              <div>
                <strong className="text-[#1A1A1A]">Benjamini-Hochberg FDR Control:</strong> Corrects
                p-values across all simultaneously evaluated statistical tests at a family-wise
                false discovery rate of &alpha; = 0.05.
              </div>
            </div>
          </section>

          {/* 4. Known Limitations */}
          <section className="p-4 rounded-md bg-[#F3EFE7] border border-[#E2DDD3] text-[13px] space-y-2 text-[#52504A]">
            <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">
              4. Known limitations (scientific disclosures)
            </h3>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>
                <strong className="text-[#1A1A1A]">Grid-cell average, not point measurement:</strong>{' '}
                Values reflect an integrated 50–60 km spatial swath; microclimates, urban heat
                islands, and local valleys may diverge.
              </li>
              <li>
                <strong className="text-[#1A1A1A]">Satellite transition artifacts:</strong>{' '}
                Reanalysis models assimilate changing satellite constellations over time (e.g. late
                1990s NOAA-15 AMSU-A introductions). Detected step shifts may reflect observing
                system transitions rather than physical climate jumps.
              </li>
              <li>
                <strong className="text-[#1A1A1A]">Precipitation stochasticity:</strong>{' '}
                Precipitation (PRECTOTCORR) is inherently high-variance; a result of &ldquo;no
                significant trend&rdquo; is normal, scientifically honest, and should not be
                misconstrued as zero change.
              </li>
              <li>
                <strong className="text-[#1A1A1A]">Zero forecasting / No causation:</strong> No
                machine learning extrapolations, projections, or causal claims are produced.
              </li>
            </ul>
          </section>

          {/* 5. Validation Block */}
          <section className="pt-5 border-t border-[#E2DDD3] space-y-3">
            <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">
              5. How we tested the statistics (validation suite)
            </h3>
            <p className="text-xs text-[#52504A]">
              To verify implementation validity against reference benchmarks, the backend is
              evaluated against synthetic datasets with known injected signals and peer-reviewed
              real-world test cases.
            </p>

            <div className="divide-y divide-[#E2DDD3] border-t border-b border-[#E2DDD3] text-xs">
              {VALIDATION_TESTS.map((test) => (
                <div key={test.id} className="py-3 space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-[#1A1A1A]">{test.title}</span>
                    <span className="text-[#6B6860]">
                      {test.status === 'pending' ? 'Result pending' : test.status}
                    </span>
                  </div>
                  <p className="text-[#52504A]">{test.description}</p>
                  <div className="text-[#1A1A1A]">
                    <span className="text-[#6B6860]">Benchmark requirement:</span> {test.expected}
                  </div>
                  <div className="text-[#1A1A1A] tabular-nums">
                    <span className="text-[#6B6860]">Recovered metric:</span>{' '}
                    {test.recoveredRate !== null
                      ? `${test.recoveredRate} °C/decade`
                      : test.recoveredYear !== null
                      ? `Year ${test.recoveredYear}`
                      : 'Result pending'}
                  </div>
                  {test.notes && <div className="text-[#6B6860] italic">{test.notes}</div>}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2DDD3] bg-[#FAF8F4] flex items-center justify-between text-xs text-[#6B6860] shrink-0">
          <span>NASA Earth System Challenge 2026</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-[#1A1A1A] hover:bg-[#33312E] text-[#FAF8F4] font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
