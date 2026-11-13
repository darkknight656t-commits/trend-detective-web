import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Clock } from 'lucide-react';

interface LoadingStateProps {
  locationText?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ locationText }) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (secondsElapsed >= 5) {
      setActiveStep(2);
    } else if (secondsElapsed >= 2) {
      setActiveStep(1);
    } else {
      setActiveStep(0);
    }
  }, [secondsElapsed]);

  const steps = [
    { label: 'Fetching NASA POWER (MERRA-2) data' },
    { label: 'Running Mann-Kendall & Pettitt change-point tests' },
    { label: 'Formulating Benjamini-Hochberg FDR adjustments' },
  ];

  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading climate analysis">
      <div className="p-4 sm:p-5 bg-[#F3EFE7] border border-[#E2DDD3] rounded-md">
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-[#1A1A1A] animate-spin shrink-0" aria-hidden="true" />
          <div>
            <h4 className="text-sm font-semibold text-[#1A1A1A]">
              Analyzing climate timeseries {locationText ? `for ${locationText}` : ''}
            </h4>
            <p className="text-xs text-[#52504A] mt-0.5 tabular-nums">
              Elapsed: {secondsElapsed}s
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E2DDD3] space-y-2">
          {steps.map((step, idx) => {
            const isDone = idx < activeStep;
            const isCurrent = idx === activeStep;
            return (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {isDone ? (
                  <CheckCircle className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0" aria-hidden="true" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#52504A] animate-spin shrink-0" aria-hidden="true" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-[#C5BFB2] shrink-0" />
                )}
                <span
                  className={
                    isDone
                      ? 'text-[#6B6860] line-through'
                      : isCurrent
                      ? 'text-[#1A1A1A] font-medium'
                      : 'text-[#6B6860]'
                  }
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {secondsElapsed >= 8 ? (
          <div className="mt-3.5 pt-3 border-t border-[#E2DDD3] flex items-start gap-2 text-xs text-[#52504A]">
            <Clock className="w-4 h-4 text-[#52504A] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-snug">
              Waking up the data server. The first request can take up to a minute. Later ones are fast.
            </p>
          </div>
        ) : secondsElapsed >= 4 ? (
          <div className="mt-3.5 pt-3 border-t border-[#E2DDD3] flex items-start gap-2 text-xs text-[#52504A]">
            <Clock className="w-4 h-4 text-[#52504A] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-snug">
              Fetching ~45 years of NASA data. First-time locations take a few seconds; repeat visits are instant.
            </p>
          </div>
        ) : null}
      </div>

      {/* Layout-matched editorial skeleton blocks */}
      <div className="space-y-6 animate-pulse" aria-hidden="true">
        {/* What the data show skeleton */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between pb-2 border-b border-[#E2DDD3]">
            <div className="h-5 w-40 bg-[#EAE5DA] rounded" />
            <div className="h-3 w-32 bg-[#EFECE4] rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-full bg-[#EFECE4] rounded" />
            <div className="h-3.5 w-11/12 bg-[#EFECE4] rounded" />
            <div className="h-3.5 w-4/5 bg-[#EFECE4] rounded" />
          </div>
          <div className="flex gap-4 pt-1">
            <div className="h-3 w-36 bg-[#EFECE4] rounded" />
            <div className="h-3 w-36 bg-[#EFECE4] rounded" />
          </div>
        </div>

        {/* Temperature card + chart skeleton */}
        <div className="pt-6 border-t border-[#E2DDD3] space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-44 bg-[#EAE5DA] rounded" />
            <div className="h-3 w-28 bg-[#EFECE4] rounded" />
          </div>
          <div className="h-9 w-52 bg-[#EAE5DA] rounded" />
          <div className="h-3.5 w-64 bg-[#EFECE4] rounded" />
          <div className="h-44 w-full bg-[#F3EFE7] border border-[#E2DDD3] rounded flex flex-col justify-between p-4">
            <div className="h-px w-full bg-[#E2DDD3]" />
            <div className="h-px w-full bg-[#E2DDD3]" />
            <div className="h-px w-full bg-[#E2DDD3]" />
            <div className="h-px w-full bg-[#E2DDD3]" />
          </div>
        </div>

        {/* Precipitation card + chart skeleton */}
        <div className="pt-6 border-t border-[#E2DDD3] space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-52 bg-[#EAE5DA] rounded" />
            <div className="h-3 w-28 bg-[#EFECE4] rounded" />
          </div>
          <div className="h-9 w-52 bg-[#EAE5DA] rounded" />
          <div className="h-3.5 w-64 bg-[#EFECE4] rounded" />
          <div className="h-44 w-full bg-[#F3EFE7] border border-[#E2DDD3] rounded flex flex-col justify-between p-4">
            <div className="h-px w-full bg-[#E2DDD3]" />
            <div className="h-px w-full bg-[#E2DDD3]" />
            <div className="h-px w-full bg-[#E2DDD3]" />
            <div className="h-px w-full bg-[#E2DDD3]" />
          </div>
        </div>
      </div>
    </div>
  );
};
