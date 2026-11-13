import React, { useState, useEffect } from 'react';
import { AnalysisResponse, LocationCoordinates } from '../types/api.ts';
import { ApiError, isFixtureModeEnabled } from '../lib/api.ts';
import { ResultColumn } from './ResultColumn.tsx';
import { CompareAlignedGrid } from './CompareAlignedGrid.tsx';
import { LoadingState } from './LoadingState.tsx';
import { ErrorState } from './ErrorState.tsx';
import { CompareControls } from './CompareControls.tsx';
import { StoryButtons } from './StoryButtons.tsx';
import { StoryLocation } from '../config/stories.ts';
import { FlaskConical } from 'lucide-react';

interface ResultsPanelProps {
  mode: 'single' | 'compare';
  singleCoords: LocationCoordinates | null;
  singleData: AnalysisResponse | null;
  singleLoading: boolean;
  singleError: ApiError | null;
  onRetrySingle: () => void;

  compareCoordsA: LocationCoordinates | null;
  compareCoordsB: LocationCoordinates | null;
  dataA: AnalysisResponse | null;
  dataB: AnalysisResponse | null;
  loadingA: boolean;
  loadingB: boolean;
  errorA: ApiError | null;
  errorB: ApiError | null;
  onRetryA: () => void;
  onRetryB: () => void;
  onSwapCompare: () => void;
  onClearCompare: () => void;

  onSelectStory: (story: StoryLocation) => void;
}

const formatCompassCoords = (coords: LocationCoordinates): string => {
  const latStr = `${Math.abs(coords.lat).toFixed(2)}°${coords.lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(coords.lon).toFixed(2)}°${coords.lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
};

const formatPeriodLabel = (data: AnalysisResponse | null): string | null => {
  if (!data?.years || data.years.length === 0) return null;
  const first = data.years[0];
  const last = data.years[data.years.length - 1];
  if (typeof first !== 'number' || typeof last !== 'number') return null;
  return `${first}–${last} · ${data.years.length} yrs`;
};

const useIsDesktop = (): boolean => {
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isDesktop;
};

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  mode,
  singleCoords,
  singleData,
  singleLoading,
  singleError,
  onRetrySingle,

  compareCoordsA,
  compareCoordsB,
  dataA,
  dataB,
  loadingA,
  loadingB,
  errorA,
  errorB,
  onRetryA,
  onRetryB,
  onSwapCompare,
  onClearCompare,

  onSelectStory,
}) => {
  const [mobileCompareTab, setMobileCompareTab] = useState<'A' | 'B'>('A');
  const isDesktop = useIsDesktop();

  const isFixture = isFixtureModeEnabled();
  const isEmptySingle = !singleCoords && !singleLoading && !singleData && !singleError;
  const bothCompareLoaded =
    mode === 'compare' &&
    Boolean(dataA) &&
    Boolean(dataB) &&
    !loadingA &&
    !loadingB &&
    !errorA &&
    !errorB;

  const singlePeriod = formatPeriodLabel(singleData);
  const periodA =
    dataA?.years && dataA.years.length > 0
      ? `${dataA.years[0]}–${dataA.years[dataA.years.length - 1]}`
      : null;
  const periodB =
    dataB?.years && dataB.years.length > 0
      ? `${dataB.years[0]}–${dataB.years[dataB.years.length - 1]}`
      : null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#FAF8F4] text-[#1A1A1A]">
      {/* Dev-only fixture banner if active */}
      {isFixture && (
        <div className="bg-[#F3EFE7] border-b border-[#D8D3C8] text-[#1A1A1A] px-4 py-1.5 text-xs font-medium text-center flex items-center justify-center gap-2 shrink-0">
          <FlaskConical className="w-3.5 h-3.5 text-[#C8472B]" aria-hidden="true" />
          <span>Fixture data (development only) — VITE_USE_FIXTURES is active</span>
        </div>
      )}

      {/* Sticky results panel header: selected location + period */}
      <div className="sticky top-0 z-10 px-5 sm:px-7 py-3 border-b border-[#E2DDD3] flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 shrink-0 bg-[#FAF8F4]/95 backdrop-blur-xs">
        {mode === 'single' ? (
          singleCoords ? (
            <>
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-xs text-[#6B6860] shrink-0">Selected location</span>
                <span className="font-serif text-base sm:text-lg font-semibold text-[#1A1A1A] tabular-nums truncate">
                  {singleData?.location
                    ? formatCompassCoords(singleData.location)
                    : formatCompassCoords(singleCoords)}
                </span>
              </div>
              <div className="text-xs text-[#52504A] tabular-nums shrink-0">
                {singleLoading
                  ? 'Analyzing…'
                  : singlePeriod
                  ? singlePeriod
                  : singleError
                  ? 'Data unavailable'
                  : ''}
              </div>
            </>
          ) : (
            <span className="text-xs text-[#52504A]">Select a point on the map</span>
          )
        ) : (
          <>
            <span className="text-xs font-medium text-[#1A1A1A]">Compare two locations</span>
            {(periodA || periodB) && (
              <span className="text-xs text-[#52504A] tabular-nums">
                {periodA ? `A: ${periodA}` : 'A: —'} · {periodB ? `B: ${periodB}` : 'B: —'}
              </span>
            )}
          </>
        )}
      </div>

      {/* Scrollable results body */}
      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
        {/* SINGLE MODE EMPTY STATE */}
        {mode === 'single' && isEmptySingle && (
          <div className="space-y-6 max-w-2xl mx-auto py-1">
            <div className="space-y-3">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#1A1A1A] text-balance">
                Is the climate shifting where you live?
              </h2>
              <p className="text-[15px] text-[#1A1A1A] leading-relaxed">
                Trend Detective retrieves roughly 45 years of continuous NASA POWER (MERRA-2)
                monthly climate reanalysis for any coordinate on Earth and displays
                significance-tested trends and abrupt change points.
              </p>
              <p className="text-sm text-[#52504A] leading-relaxed">
                Built for anyone asking: is the climate where I live, or where I care about,
                shifting? Farmers, city planners, students and journalists.
              </p>
            </div>

            {/* Quick preset locations */}
            <div className="pt-5 border-t border-[#E2DDD3] space-y-3">
              <div className="text-xs font-medium text-[#52504A]">
                Select an exploration preset or click anywhere on the map:
              </div>
              <StoryButtons onSelectStory={onSelectStory} activeCoords={singleCoords} />
            </div>

            <div className="pt-5 border-t border-[#E2DDD3] text-xs text-[#52504A] space-y-2 leading-relaxed">
              <div className="font-semibold text-[#1A1A1A]">How to use</div>
              <div>
                <strong className="font-medium text-[#1A1A1A]">Single click on the map:</strong>{' '}
                Drops a marker and runs full time-series tests on the surrounding ~50-60 km grid
                cell.
              </div>
              <div>
                <strong className="font-medium text-[#1A1A1A]">Compare mode:</strong> Select two
                separate locations to contrast air temperature at 2 m (T2M) and bias-corrected
                precipitation (PRECTOTCORR) shifts.
              </div>
              <div>
                <strong className="font-medium text-[#1A1A1A]">No synthetic filling:</strong> If
                NASA reanalysis has no data, we report it honestly.
              </div>
            </div>
          </div>
        )}

        {/* SINGLE MODE ACTIVE STATE */}
        {mode === 'single' && !isEmptySingle && (
          <div className="max-w-2xl mx-auto space-y-6">
            {singleLoading && (
              <LoadingState
                locationText={
                  singleCoords
                    ? `${singleCoords.lat.toFixed(2)}°, ${singleCoords.lon.toFixed(2)}°`
                    : ''
                }
              />
            )}

            {!singleLoading && singleError && (
              <ErrorState
                error={singleError}
                onRetry={onRetrySingle}
                locationName={
                  singleCoords
                    ? `${singleCoords.lat.toFixed(2)}°, ${singleCoords.lon.toFixed(2)}°`
                    : ''
                }
              />
            )}

            {!singleLoading && !singleError && singleData && (
              <ResultColumn data={singleData} badgeColor="cyan" hideHeader={true} />
            )}
          </div>
        )}

        {/* COMPARE MODE */}
        {mode === 'compare' && (
          <div className="space-y-6">
            <CompareControls
              hasA={Boolean(compareCoordsA)}
              hasB={Boolean(compareCoordsB)}
              dataA={dataA}
              dataB={dataB}
              onSwap={onSwapCompare}
              onClear={onClearCompare}
            />

            {/* Mobile Tab Switcher */}
            <div className="lg:hidden flex rounded-md p-1 bg-[#F2EEE6] border border-[#E2DDD3]">
              <button
                type="button"
                onClick={() => setMobileCompareTab('A')}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded transition-colors tabular-nums inline-flex items-center justify-center gap-1.5 ${
                  mobileCompareTab === 'A'
                    ? 'bg-[#FAF8F4] text-[#1A1A1A] shadow-xs border border-[#D8D3C8]'
                    : 'text-[#52504A] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-[#C8472B]" aria-hidden="true" />
                <span>
                  Location A {compareCoordsA ? `(${compareCoordsA.lat.toFixed(1)}°)` : '(Empty)'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMobileCompareTab('B')}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded transition-colors tabular-nums inline-flex items-center justify-center gap-1.5 ${
                  mobileCompareTab === 'B'
                    ? 'bg-[#FAF8F4] text-[#1A1A1A] shadow-xs border border-[#D8D3C8]'
                    : 'text-[#52504A] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-[#2F6C9F]" aria-hidden="true" />
                <span>
                  Location B {compareCoordsB ? `(${compareCoordsB.lat.toFixed(1)}°)` : '(Empty)'}
                </span>
              </button>
            </div>

            {/* Desktop Synchronized Aligned Grid when both Location A & B are loaded */}
            {isDesktop && bothCompareLoaded && dataA && dataB ? (
              <CompareAlignedGrid dataA={dataA} dataB={dataB} />
            ) : (
              /* Mobile View (and Desktop fallback while either side is loading/errored/empty) */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Column A */}
                {(isDesktop || mobileCompareTab === 'A') && (
                  <div className="space-y-4">
                    {(loadingA || errorA || !dataA) && (
                      <div className="pb-2 border-b border-[#E2DDD3] text-xs flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#1A1A1A]">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full bg-[#C8472B]"
                            aria-hidden="true"
                          />
                          Location A
                        </span>
                        {compareCoordsA && (
                          <span className="text-[#52504A] tabular-nums">
                            {compareCoordsA.lat.toFixed(2)}°, {compareCoordsA.lon.toFixed(2)}°
                          </span>
                        )}
                      </div>
                    )}

                    {loadingA && (
                      <LoadingState
                        locationText={
                          compareCoordsA
                            ? `Location A (${compareCoordsA.lat.toFixed(2)}°, ${compareCoordsA.lon.toFixed(2)}°)`
                            : 'Location A'
                        }
                      />
                    )}
                    {!loadingA && errorA && (
                      <ErrorState
                        error={errorA}
                        onRetry={onRetryA}
                        locationName="Location A"
                      />
                    )}
                    {!loadingA && !errorA && dataA && (
                      <ResultColumn data={dataA} label="Location A" badgeColor="emerald" />
                    )}
                    {!loadingA && !errorA && !dataA && !compareCoordsA && (
                      <div className="py-10 px-4 text-center border border-dashed border-[#D8D3C8] rounded-md text-[#6B6860] text-xs">
                        Click the map to select Location A
                      </div>
                    )}
                  </div>
                )}

                {/* Column B */}
                {(isDesktop || mobileCompareTab === 'B') && (
                  <div className="space-y-4">
                    {(loadingB || errorB || !dataB) && (
                      <div className="pb-2 border-b border-[#E2DDD3] text-xs flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#1A1A1A]">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full bg-[#2F6C9F]"
                            aria-hidden="true"
                          />
                          Location B
                        </span>
                        {compareCoordsB && (
                          <span className="text-[#52504A] tabular-nums">
                            {compareCoordsB.lat.toFixed(2)}°, {compareCoordsB.lon.toFixed(2)}°
                          </span>
                        )}
                      </div>
                    )}

                    {loadingB && (
                      <LoadingState
                        locationText={
                          compareCoordsB
                            ? `Location B (${compareCoordsB.lat.toFixed(2)}°, ${compareCoordsB.lon.toFixed(2)}°)`
                            : 'Location B'
                        }
                      />
                    )}
                    {!loadingB && errorB && (
                      <ErrorState
                        error={errorB}
                        onRetry={onRetryB}
                        locationName="Location B"
                      />
                    )}
                    {!loadingB && !errorB && dataB && (
                      <ResultColumn data={dataB} label="Location B" badgeColor="amber" />
                    )}
                    {!loadingB && !errorB && !dataB && !compareCoordsB && (
                      <div className="py-10 px-4 text-center border border-dashed border-[#D8D3C8] rounded-md text-[#6B6860] text-xs">
                        Click the map to select Location B
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
