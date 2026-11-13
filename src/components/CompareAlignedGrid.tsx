import React from 'react';
import { AnalysisResponse } from '../types/api.ts';
import { SummaryBlock } from './SummaryBlock.tsx';
import { TrendCard } from './TrendCard.tsx';
import { ChangePointCallout } from './ChangePointCallout.tsx';
import { TimeSeriesChart } from './TimeSeriesChart.tsx';
import { CorrelationCard } from './CorrelationCard.tsx';
import { TrustPanel } from './TrustPanel.tsx';

interface CompareAlignedGridProps {
  dataA: AnalysisResponse;
  dataB: AnalysisResponse;
}

const formatColumnHeader = (data: AnalysisResponse) => {
  const hasLocation =
    typeof data.location?.lat === 'number' &&
    Number.isFinite(data.location.lat) &&
    typeof data.location?.lon === 'number' &&
    Number.isFinite(data.location.lon);

  const coordsText = hasLocation
    ? `${Math.abs(data.location.lat).toFixed(2)}°${data.location.lat >= 0 ? 'N' : 'S'}, ${Math.abs(data.location.lon).toFixed(2)}°${data.location.lon >= 0 ? 'E' : 'W'}`
    : null;

  const hasYears =
    Array.isArray(data.years) &&
    data.years.length > 0 &&
    typeof data.years[0] === 'number' &&
    typeof data.years[data.years.length - 1] === 'number';

  const periodText = hasYears ? `${data.years[0]}–${data.years[data.years.length - 1]}` : null;

  return { coordsText, periodText };
};

export const CompareAlignedGrid: React.FC<CompareAlignedGridProps> = ({ dataA, dataB }) => {
  const headerA = formatColumnHeader(dataA);
  const headerB = formatColumnHeader(dataB);

  const hasTempChangeA = Boolean(dataA.temperature?.change_point_significant);
  const hasTempChangeB = Boolean(dataB.temperature?.change_point_significant);
  const hasAnyTempChange = hasTempChangeA || hasTempChangeB;

  const hasPrecipChangeA = Boolean(dataA.precipitation?.change_point_significant);
  const hasPrecipChangeB = Boolean(dataB.precipitation?.change_point_significant);
  const hasAnyPrecipChange = hasPrecipChangeA || hasPrecipChangeB;

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-6 items-start">
      {/* Row 1: Column A & B Titles with matching marker colors */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-[#E2DDD3]">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A]">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#C8472B]" aria-hidden="true" />
            <span>Location A</span>
          </span>
          {headerA.coordsText && (
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] tabular-nums">
              {headerA.coordsText}
            </h2>
          )}
        </div>
        {headerA.periodText && (
          <span className="text-xs text-[#6B6860] tabular-nums">{headerA.periodText}</span>
        )}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-[#E2DDD3]">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A]">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2F6C9F]" aria-hidden="true" />
            <span>Location B</span>
          </span>
          {headerB.coordsText && (
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] tabular-nums">
              {headerB.coordsText}
            </h2>
          )}
        </div>
        {headerB.periodText && (
          <span className="text-xs text-[#6B6860] tabular-nums">{headerB.periodText}</span>
        )}
      </div>

      {/* Row 2: What the data show */}
      <div>
        <SummaryBlock data={dataA} />
      </div>
      <div>
        <SummaryBlock data={dataB} />
      </div>

      {/* Row 3: Air temperature at 2 m (T2M) TrendCard */}
      {(dataA.temperature || dataB.temperature) && (
        <>
          <div>
            {dataA.temperature && (
              <TrendCard
                title="Air temperature at 2 m (T2M)"
                variableName="Temperature"
                stats={dataA.temperature}
                themeColor="amber"
              />
            )}
          </div>
          <div>
            {dataB.temperature && (
              <TrendCard
                title="Air temperature at 2 m (T2M)"
                variableName="Temperature"
                stats={dataB.temperature}
                themeColor="amber"
              />
            )}
          </div>
        </>
      )}

      {/* Row 4: T2M Change Point Callouts (aligned row when either has one) */}
      {hasAnyTempChange && (
        <>
          <div>
            {dataA.temperature && (
              <ChangePointCallout
                stats={dataA.temperature}
                variableName="Air temperature at 2 m (T2M)"
              />
            )}
          </div>
          <div>
            {dataB.temperature && (
              <ChangePointCallout
                stats={dataB.temperature}
                variableName="Air temperature at 2 m (T2M)"
              />
            )}
          </div>
        </>
      )}

      {/* Row 5: T2M Time Series Charts */}
      {(dataA.temperature || dataB.temperature) && (
        <>
          <div>
            {dataA.temperature && (
              <TimeSeriesChart
                title="Air temperature at 2 m (T2M) — History & Trend"
                variableName="Air temperature at 2 m (T2M)"
                years={dataA.years}
                stats={dataA.temperature}
                color="#C8472B"
                trendColor="#C8472B"
              />
            )}
          </div>
          <div>
            {dataB.temperature && (
              <TimeSeriesChart
                title="Air temperature at 2 m (T2M) — History & Trend"
                variableName="Air temperature at 2 m (T2M)"
                years={dataB.years}
                stats={dataB.temperature}
                color="#C8472B"
                trendColor="#C8472B"
              />
            )}
          </div>
        </>
      )}

      {/* Row 6: Precipitation (PRECTOTCORR) TrendCard */}
      {(dataA.precipitation || dataB.precipitation) && (
        <>
          <div>
            {dataA.precipitation && (
              <TrendCard
                title="Precipitation (PRECTOTCORR, bias-corrected)"
                variableName="Precipitation"
                stats={dataA.precipitation}
                themeColor="cyan"
              />
            )}
          </div>
          <div>
            {dataB.precipitation && (
              <TrendCard
                title="Precipitation (PRECTOTCORR, bias-corrected)"
                variableName="Precipitation"
                stats={dataB.precipitation}
                themeColor="cyan"
              />
            )}
          </div>
        </>
      )}

      {/* Row 7: PRECTOTCORR Change Point Callouts */}
      {hasAnyPrecipChange && (
        <>
          <div>
            {dataA.precipitation && (
              <ChangePointCallout
                stats={dataA.precipitation}
                variableName="Precipitation (PRECTOTCORR, bias-corrected)"
              />
            )}
          </div>
          <div>
            {dataB.precipitation && (
              <ChangePointCallout
                stats={dataB.precipitation}
                variableName="Precipitation (PRECTOTCORR, bias-corrected)"
              />
            )}
          </div>
        </>
      )}

      {/* Row 8: PRECTOTCORR Time Series Charts */}
      {(dataA.precipitation || dataB.precipitation) && (
        <>
          <div>
            {dataA.precipitation && (
              <TimeSeriesChart
                title="Precipitation (PRECTOTCORR, bias-corrected) — History & Trend"
                variableName="Precipitation (PRECTOTCORR, bias-corrected)"
                years={dataA.years}
                stats={dataA.precipitation}
                color="#2F6C9F"
                trendColor="#2F6C9F"
              />
            )}
          </div>
          <div>
            {dataB.precipitation && (
              <TimeSeriesChart
                title="Precipitation (PRECTOTCORR, bias-corrected) — History & Trend"
                variableName="Precipitation (PRECTOTCORR, bias-corrected)"
                years={dataB.years}
                stats={dataB.precipitation}
                color="#2F6C9F"
                trendColor="#2F6C9F"
              />
            )}
          </div>
        </>
      )}

      {/* Row 9: Correlation Cards */}
      {(dataA.correlation || dataB.correlation) && (
        <>
          <div>{dataA.correlation && <CorrelationCard correlation={dataA.correlation} />}</div>
          <div>{dataB.correlation && <CorrelationCard correlation={dataB.correlation} />}</div>
        </>
      )}

      {/* Row 10: How to read this result (Trust Panel) */}
      <div>
        <TrustPanel data={dataA} />
      </div>
      <div>
        <TrustPanel data={dataB} />
      </div>
    </div>
  );
};
