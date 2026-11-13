import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapView } from './components/MapView.tsx';
import { ResultsPanel } from './components/ResultsPanel.tsx';
import { MethodologyModal } from './components/MethodologyModal.tsx';
import { StoryButtons } from './components/StoryButtons.tsx';
import { CopyLinkButton } from './components/CopyLinkButton.tsx';
import { StoryLocation } from './config/stories.ts';
import { AnalysisResponse, LocationCoordinates } from './types/api.ts';
import { fetchTrendAnalysis, wakeUpBackend, ApiError } from './lib/api.ts';
import { parseUrlState, updateUrlState, getShareableUrl } from './lib/urlState.ts';
import { HelpCircle, ArrowLeftRight } from 'lucide-react';

export const App: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'compare'>('single');

  // Single mode state
  const [singleCoords, setSingleCoords] = useState<LocationCoordinates | null>(null);
  const [singleData, setSingleData] = useState<AnalysisResponse | null>(null);
  const [singleLoading, setSingleLoading] = useState<boolean>(false);
  const [singleError, setSingleError] = useState<ApiError | null>(null);
  const singleAbortRef = useRef<AbortController | null>(null);

  // Compare mode state
  const [compareCoordsA, setCompareCoordsA] = useState<LocationCoordinates | null>(null);
  const [compareCoordsB, setCompareCoordsB] = useState<LocationCoordinates | null>(null);
  const [dataA, setDataA] = useState<AnalysisResponse | null>(null);
  const [dataB, setDataB] = useState<AnalysisResponse | null>(null);
  const [loadingA, setLoadingA] = useState<boolean>(false);
  const [loadingB, setLoadingB] = useState<boolean>(false);
  const [errorA, setErrorA] = useState<ApiError | null>(null);
  const [errorB, setErrorB] = useState<ApiError | null>(null);
  const abortARef = useRef<AbortController | null>(null);
  const abortBRef = useRef<AbortController | null>(null);

  // Map flyTo coords state
  const [flyToCoords, setFlyToCoords] = useState<{ lat: number; lon: number; zoom?: number } | null>(
    null
  );

  // Accessibility live announcement message
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  // Methodology modal visibility
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);

  // Single Mode Analysis Request
  const runSingleAnalysis = useCallback(async (coords: LocationCoordinates) => {
    if (singleAbortRef.current) {
      singleAbortRef.current.abort();
    }
    const controller = new AbortController();
    singleAbortRef.current = controller;

    setSingleCoords(coords);
    setSingleLoading(true);
    setSingleError(null);
    setLiveAnnouncement(`Analyzing NASA climate timeseries for coordinates ${coords.lat}, ${coords.lon}`);

    updateUrlState('single', { single: coords });

    try {
      const result = await fetchTrendAnalysis(coords.lat, coords.lon, controller.signal);
      setSingleData(result);
      setSingleLoading(false);
      setLiveAnnouncement(`Analysis complete for ${coords.lat}, ${coords.lon}`);
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        return;
      }
      setSingleLoading(false);
      const apiErr = (err as ApiError) || {
        code: 'GENERIC_ERROR',
        message: "Couldn't reach the server. No data was shown.",
      };
      setSingleError(apiErr);
      setLiveAnnouncement(`Error analyzing ${coords.lat}, ${coords.lon}: ${apiErr.message}`);
    }
  }, []);

  // Compare Mode Analysis for Location A
  const runCompareAnalysisA = useCallback(async (coords: LocationCoordinates) => {
    if (abortARef.current) {
      abortARef.current.abort();
    }
    const controller = new AbortController();
    abortARef.current = controller;

    setCompareCoordsA(coords);
    setLoadingA(true);
    setErrorA(null);

    try {
      const result = await fetchTrendAnalysis(coords.lat, coords.lon, controller.signal);
      setDataA(result);
      setLoadingA(false);
      setLiveAnnouncement(`Analysis complete for Location A: ${coords.lat}, ${coords.lon}`);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setLoadingA(false);
      setErrorA(
        (err as ApiError) || {
          code: 'GENERIC_ERROR',
          message: "Couldn't reach the server. No data was shown.",
        }
      );
    }
  }, []);

  // Compare Mode Analysis for Location B
  const runCompareAnalysisB = useCallback(async (coords: LocationCoordinates) => {
    if (abortBRef.current) {
      abortBRef.current.abort();
    }
    const controller = new AbortController();
    abortBRef.current = controller;

    setCompareCoordsB(coords);
    setLoadingB(true);
    setErrorB(null);

    try {
      const result = await fetchTrendAnalysis(coords.lat, coords.lon, controller.signal);
      setDataB(result);
      setLoadingB(false);
      setLiveAnnouncement(`Analysis complete for Location B: ${coords.lat}, ${coords.lon}`);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setLoadingB(false);
      setErrorB(
        (err as ApiError) || {
          code: 'GENERIC_ERROR',
          message: "Couldn't reach the server. No data was shown.",
        }
      );
    }
  }, []);

  // Handle Map Clicks
  const handleMapClick = useCallback(
    (coords: LocationCoordinates) => {
      if (mode === 'single') {
        void runSingleAnalysis(coords);
      } else {
        if (!compareCoordsA) {
          void runCompareAnalysisA(coords);
          updateUrlState('compare', { compareA: coords, compareB: compareCoordsB });
        } else {
          void runCompareAnalysisB(coords);
          updateUrlState('compare', { compareA: compareCoordsA, compareB: coords });
        }
      }
    },
    [mode, compareCoordsA, compareCoordsB, runSingleAnalysis, runCompareAnalysisA, runCompareAnalysisB]
  );

  // Search Bar or Device Geolocation Selection
  const handleLocationSearch = useCallback(
    (coords: LocationCoordinates) => {
      setFlyToCoords({ lat: coords.lat, lon: coords.lon, zoom: 8.5 });
      handleMapClick(coords);
    },
    [handleMapClick]
  );

  // Story Button Click Handler
  const handleSelectStory = useCallback(
    (story: StoryLocation) => {
      const coords: LocationCoordinates = { lat: story.lat, lon: story.lon };
      setFlyToCoords({ lat: story.lat, lon: story.lon, zoom: story.zoom });

      if (mode === 'single') {
        void runSingleAnalysis(coords);
      } else {
        if (!compareCoordsA) {
          void runCompareAnalysisA(coords);
          updateUrlState('compare', { compareA: coords, compareB: compareCoordsB });
        } else {
          void runCompareAnalysisB(coords);
          updateUrlState('compare', { compareA: compareCoordsA, compareB: coords });
        }
      }
    },
    [mode, compareCoordsA, compareCoordsB, runSingleAnalysis, runCompareAnalysisA, runCompareAnalysisB]
  );

  // Wake up sleeping backend silently on initial load
  useEffect(() => {
    wakeUpBackend();
  }, []);

  // Initial load: parse URL search parameters and autorun
  useEffect(() => {
    const parsed = parseUrlState();

    if (parsed.mode === 'single' && parsed.singleLocation) {
      setMode('single');
      setFlyToCoords({
        lat: parsed.singleLocation.lat,
        lon: parsed.singleLocation.lon,
        zoom: 5.5,
      });
      void runSingleAnalysis(parsed.singleLocation);
    } else if (parsed.mode === 'compare') {
      setMode('compare');
      if (parsed.compareA) {
        setFlyToCoords({ lat: parsed.compareA.lat, lon: parsed.compareA.lon, zoom: 4.5 });
        void runCompareAnalysisA(parsed.compareA);
      }
      if (parsed.compareB) {
        void runCompareAnalysisB(parsed.compareB);
      }
    }
  }, [runSingleAnalysis, runCompareAnalysisA, runCompareAnalysisB]);

  // Toggle Compare Mode
  const toggleMode = () => {
    if (mode === 'single') {
      setMode('compare');
      if (singleCoords) {
        setCompareCoordsA(singleCoords);
        setDataA(singleData);
        setErrorA(singleError);
        updateUrlState('compare', { compareA: singleCoords, compareB: compareCoordsB });
      } else {
        updateUrlState('compare', { compareA: null, compareB: null });
      }
    } else {
      setMode('single');
      if (compareCoordsA) {
        setSingleCoords(compareCoordsA);
        setSingleData(dataA);
        setSingleError(errorA);
        updateUrlState('single', { single: compareCoordsA });
      } else {
        updateUrlState('single', { single: null });
      }
    }
  };

  // Compare mode swap A/B
  const handleSwapCompare = () => {
    const tempCoords = compareCoordsA;
    const tempData = dataA;
    const tempError = errorA;

    setCompareCoordsA(compareCoordsB);
    setDataA(dataB);
    setErrorA(errorB);

    setCompareCoordsB(tempCoords);
    setDataB(tempData);
    setErrorB(tempError);

    updateUrlState('compare', { compareA: compareCoordsB, compareB: tempCoords });
  };

  // Compare mode clear
  const handleClearCompare = () => {
    if (abortARef.current) abortARef.current.abort();
    if (abortBRef.current) abortBRef.current.abort();

    setCompareCoordsA(null);
    setCompareCoordsB(null);
    setDataA(null);
    setDataB(null);
    setErrorA(null);
    setErrorB(null);

    updateUrlState('compare', { compareA: null, compareB: null });
  };

  // Share URL generator
  const getShareUrl = () => {
    if (mode === 'single') {
      return getShareableUrl('single', { single: singleCoords });
    }
    return getShareableUrl('compare', {
      compareA: compareCoordsA,
      compareB: compareCoordsB,
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#FAF8F4] text-[#1A1A1A] overflow-hidden">

      {/* Screen reader live notification region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      {/* EDITORIAL MASTHEAD */}
      <header className="h-14 px-3 sm:px-6 bg-[#FAF8F4] border-b border-[#E2DDD3] flex items-center justify-between gap-4 shrink-0 z-20">
        {/* Brand Wordmark */}
        <h1 className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-[#1A1A1A] whitespace-nowrap shrink-0">
          Trend Detective
        </h1>

        {/* Story presets (Desktop) */}
        <nav aria-label="Preset locations" className="hidden xl:flex items-center gap-1 min-w-0">
          <StoryButtons
            onSelectStory={handleSelectStory}
            activeCoords={mode === 'single' ? singleCoords : compareCoordsA}
            isCompact={true}
          />
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleMode}
            aria-pressed={mode === 'compare'}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors border whitespace-nowrap shrink-0 ${
              mode === 'compare'
                ? 'bg-[#1A1A1A] text-[#FAF8F4] border-[#1A1A1A]'
                : 'bg-[#FAF8F4] hover:bg-[#F2EEE6] text-[#1A1A1A] border-[#D8D3C8]'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{mode === 'compare' ? 'Compare on' : 'Compare'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMethodologyOpen(true)}
            aria-label="View methodology and limitations"
            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-medium text-[#52504A] hover:text-[#1A1A1A] hover:bg-[#F2EEE6] transition-colors whitespace-nowrap shrink-0"
          >
            <HelpCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden md:inline">Methodology</span>
          </button>

          <CopyLinkButton getUrl={getShareUrl} compactOnMobile={true} />
        </div>
      </header>

      {/* MAIN VIEWPORT SPLIT */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* MAP CONTAINER */}
        <div className="w-full lg:w-[54%] xl:w-[57%] h-[40vh] lg:h-full relative shrink-0">
          <MapView
            mode={mode}
            singleMarker={singleCoords}
            markerA={compareCoordsA}
            markerB={compareCoordsB}
            onMapClick={handleMapClick}
            onLocationSearch={handleLocationSearch}
            flyToCoords={flyToCoords}
          />
        </div>

        {/* RESULTS PANEL */}
        <div className="w-full lg:w-[46%] xl:w-[43%] flex-1 lg:h-full border-t lg:border-t-0 lg:border-l border-[#E2DDD3] overflow-hidden">
          <ResultsPanel
            mode={mode}
            singleCoords={singleCoords}
            singleData={singleData}
            singleLoading={singleLoading}
            singleError={singleError}
            onRetrySingle={() => singleCoords && runSingleAnalysis(singleCoords)}

            compareCoordsA={compareCoordsA}
            compareCoordsB={compareCoordsB}
            dataA={dataA}
            dataB={dataB}
            loadingA={loadingA}
            loadingB={loadingB}
            errorA={errorA}
            errorB={errorB}
            onRetryA={() => compareCoordsA && runCompareAnalysisA(compareCoordsA)}
            onRetryB={() => compareCoordsB && runCompareAnalysisB(compareCoordsB)}
            onSwapCompare={handleSwapCompare}
            onClearCompare={handleClearCompare}

            onSelectStory={handleSelectStory}
          />
        </div>
      </main>

      {/* Methodology & Limitations Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};
