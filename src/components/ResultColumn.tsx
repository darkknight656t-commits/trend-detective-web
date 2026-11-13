import React from 'react';
import { AnalysisResponse } from '../types/api.ts';
import { SummaryBlock } from './SummaryBlock.tsx';
import { TrendCard } from './TrendCard.tsx';
import { ChangePointCallout } from './ChangePointCallout.tsx';
import { TimeSeriesChart } from './TimeSeriesChart.tsx';
import { CorrelationCard } from './CorrelationCard.tsx';
import { TrustPanel } from './TrustPanel.tsx';

interface ResultColumnProps {
  data: AnalysisResponse;
  label?: string; // e.g. "Location A" or "Location B"
  badgeColor?: 'emerald' | 'amber' | 'cyan';
  hideHeader?: boolean;
}

export const ResultColumn: React.FC<ResultColumnProps> = ({
  data,
  label,
  badgeColor = 'cyan',
  hideHeader = false,
}) => {
  const hasLocation =
    typeof data.location?.lat === 'number' &&
    Number.isFinite(data.location.lat) &&
    typeof data.location?.lon === 'number' &&
    Number.isFinite(data.location.lon);

  const latFormatted = hasLocation
    ? `${Math.abs(data.location.lat).toFixed(2)}°${data.location.lat >= 0 ? 'N' : 'S'}`
    : null;
  const lonFormatted = hasLocation
    ? `${Math.abs(data.location.lon).toFixed(2)}°${data.location.lon >= 0 ? 'E' : 'W'}`
    : null;

  const hasYears =
    Array.isArray(data.years) &&
    data.years.length > 0 &&
    typeof data.years[0] === 'number' &&
    typeof data.years[data.years.length - 1] === 'number';

  const markerDotHex =
    badgeColor === 'emerald' ? '#C8472B' : badgeColor === 'amber' ? '#2F6C9F' : '#1A1A1A';

  return (
    <article className="space-y-6">
      {/* Column location header */}
      {!hideHeader && (label || (latFormatted && lonFormatted) || hasYears) && (
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-[#E2DDD3]">
          <div className="flex flex-wrap items-baseline gap-2.5">
            {label && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A]">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: markerDotHex }}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </span>
            )}
            {latFormatted && lonFormatted && (
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#1A1A1A] tabular-nums">
                {latFormatted}, {lonFormatted}
              </h2>
            )}
          </div>
          {hasYears && (
            <span className="text-xs text-[#6B6860] tabular-nums">
              {data.years[0]}–{data.years[data.years.length - 1]}
            </span>
          )}
        </div>
      )}

      {/* 1. What the data show */}
      <SummaryBlock data={data} />

      {/* 2. Temperature (T2M) Stats, Change Point & Chart */}
      {data.temperature && (
        <div className="space-y-4">
          <TrendCard
            title="Air temperature at 2 m (T2M)"
            variableName="Temperature"
            stats={data.temperature}
            themeColor="amber"
          />

          <ChangePointCallout
            stats={data.temperature}
            variableName="Air temperature at 2 m (T2M)"
          />

          <TimeSeriesChart
            title="Air temperature at 2 m (T2M) — History & Trend"
            variableName="Air temperature at 2 m (T2M)"
            years={data.years}
            stats={data.temperature}
            color="#C8472B"
            trendColor="#C8472B"
          />
        </div>
      )}

      {/* 3. Precipitation (PRECTOTCORR) Stats, Change Point & Chart */}
      {data.precipitation && (
        <div className="space-y-4">
          <TrendCard
            title="Precipitation (PRECTOTCORR, bias-corrected)"
            variableName="Precipitation"
            stats={data.precipitation}
            themeColor="cyan"
          />

          <ChangePointCallout
            stats={data.precipitation}
            variableName="Precipitation (PRECTOTCORR, bias-corrected)"
          />

          <TimeSeriesChart
            title="Precipitation (PRECTOTCORR, bias-corrected) — History & Trend"
            variableName="Precipitation (PRECTOTCORR, bias-corrected)"
            years={data.years}
            stats={data.precipitation}
            color="#2F6C9F"
            trendColor="#2F6C9F"
          />
        </div>
      )}

      {/* 4. Correlation / Co-movement */}
      {data.correlation && <CorrelationCard correlation={data.correlation} />}

      {/* 5. How to read this result (Trust Panel) */}
      <TrustPanel data={data} />
    </article>
  );
};
