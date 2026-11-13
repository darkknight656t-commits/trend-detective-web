import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LocateFixed,
  Loader2,
  X,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { LocationCoordinates } from '../types/api.ts';
import { roundCoord } from '../lib/format.ts';
import {
  formatGeolocationNotice,
  GeocodedPlace,
  parseCoordinateInput,
  searchLocationName,
} from '../lib/geocode.ts';

interface MapSearchBarProps {
  onSelectLocation: (coords: LocationCoordinates, label?: string) => void;
  onDropdownOpenChange?: (isOpen: boolean) => void;
}

interface SearchNotice {
  type: 'info' | 'error';
  text: string;
  autoDismiss?: boolean;
}

export const MapSearchBar: React.FC<MapSearchBarProps> = ({
  onSelectLocation,
  onDropdownOpenChange,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [notice, setNotice] = useState<SearchNotice | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const skipNextFetchRef = useRef(false);

  const parsedCoords = parseCoordinateInput(query);
  const showDropdown =
    isOpen && (parsedCoords.status === 'valid' || results.length > 0 || isSearching);

  useEffect(() => {
    onDropdownOpenChange?.(showDropdown || Boolean(notice));
  }, [showDropdown, notice, onDropdownOpenChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Debounced keyless place-name autocomplete
  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2 || parsedCoords.status !== 'not_coords') {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      setResults([]);
      setIsSearching(false);
      setHighlightedIdx(-1);
      return;
    }

    setIsSearching(true);
    setNotice(null);

    const timer = window.setTimeout(async () => {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      try {
        const places = await searchLocationName(trimmed, controller.signal);
        if (controller.signal.aborted) return;
        setResults(places);
        setHighlightedIdx(places.length > 0 ? 0 : -1);
        setIsSearching(false);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setResults([]);
        setIsSearching(false);
        const message =
          err instanceof Error && err.message
            ? 'Place search is temporarily unavailable. Enter lat, lon coordinates or click the map.'
            : 'Could not reach location search.';
        setNotice({ type: 'error', text: message });
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, parsedCoords.status]);

  const selectPlace = (place: GeocodedPlace) => {
    const fullLabel = place.subtitle ? `${place.label}, ${place.subtitle}` : place.label;
    skipNextFetchRef.current = true;
    setQuery(fullLabel);
    setResults([]);
    setIsOpen(false);
    setNotice(null);
    onSelectLocation({ lat: place.lat, lon: place.lon }, fullLabel);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setNotice(null);

    // 1. Direct coordinate entry
    const parsed = parseCoordinateInput(trimmed);
    if (parsed.status === 'valid') {
      setIsOpen(false);
      setResults([]);
      onSelectLocation({ lat: parsed.lat, lon: parsed.lon });
      return;
    }
    if (parsed.status === 'invalid') {
      setIsOpen(false);
      setNotice({ type: 'error', text: parsed.error });
      return;
    }

    // 2. Highlighted autocomplete option already available
    if (isOpen && highlightedIdx >= 0 && results[highlightedIdx]) {
      selectPlace(results[highlightedIdx]);
      return;
    }

    // 3. Direct search on submit
    if (searchAbortRef.current) searchAbortRef.current.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setIsSearching(true);

    try {
      const places = await searchLocationName(trimmed, controller.signal);
      if (controller.signal.aborted) return;
      setIsSearching(false);
      if (places.length > 0) {
        selectPlace(places[0]);
      } else {
        setResults([]);
        setIsOpen(false);
        setNotice({
          type: 'info',
          text: 'No matching location found. Try another place name or enter lat, lon coordinates.',
        });
      }
    } catch {
      if (controller.signal.aborted) return;
      setIsSearching(false);
      setNotice({
        type: 'error',
        text: 'Place search is temporarily unavailable. Enter lat, lon coordinates or click the map.',
      });
    }
  };

  // Auto-dismiss transient info notices
  useEffect(() => {
    if (!notice || notice.type !== 'info' || notice.autoDismiss === false) return;
    if (isLocating) return;
    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [notice, isLocating]);

  const applyGeolocationSuccess = (position: GeolocationPosition) => {
    const lat = roundCoord(position.coords.latitude);
    const lon = roundCoord(position.coords.longitude);
    const geoNotice = formatGeolocationNotice(lat, lon, position.coords.accuracy);

    setIsLocating(false);
    skipNextFetchRef.current = true;
    setQuery(`${lat.toFixed(2)}, ${lon.toFixed(2)}`);
    setResults([]);
    setNotice({
      type: 'info',
      text: geoNotice.text,
      autoDismiss: !geoNotice.isCoarse,
    });
    onSelectLocation({ lat, lon }, 'Your location');
  };

  const applyGeolocationError = (err: GeolocationPositionError) => {
    setIsLocating(false);
    if (err.code === err.PERMISSION_DENIED) {
      setNotice({
        type: 'error',
        text: 'Location permission denied. Search a place name, enter lat, lon, or click the map.',
      });
    } else if (err.code === err.TIMEOUT) {
      setNotice({
        type: 'error',
        text: 'Timed out checking your location. Try again or search a place name.',
      });
    } else {
      setNotice({
        type: 'error',
        text: 'Could not determine your device location. Search a place name or click the map.',
      });
    }
  };

  const handleUseMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setNotice({
        type: 'error',
        text: 'Device geolocation is not supported in this browser. Search a place name or click the map.',
      });
      return;
    }

    setIsOpen(false);
    setIsLocating(true);
    setNotice({ type: 'info', text: 'Checking your device location...', autoDismiss: false });

    navigator.geolocation.getCurrentPosition(
      applyGeolocationSuccess,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          applyGeolocationError(err);
          return;
        }
        navigator.geolocation.getCurrentPosition(applyGeolocationSuccess, applyGeolocationError, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || results.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearSearch = () => {
    if (searchAbortRef.current) searchAbortRef.current.abort();
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setIsSearching(false);
    setNotice(null);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md pointer-events-auto">
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Search location or coordinates"
        className="flex items-center bg-white/95 border border-[#D8D3C8] rounded-lg shadow-sm focus-within:border-[#1A1A1A] focus-within:ring-1 focus-within:ring-[#1A1A1A] transition-shadow"
      >
        <button
          type="submit"
          aria-label="Search location"
          className="pl-3 pr-2 py-2 text-[#52504A] hover:text-[#1A1A1A] shrink-0"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setNotice(null);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search place or lat, lon"
          aria-label="Search place name or coordinates"
          aria-expanded={showDropdown}
          aria-controls="map-search-results"
          autoComplete="off"
          className="flex-1 min-w-0 py-2 pr-1 text-xs sm:text-sm bg-transparent text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="p-1.5 text-[#6B6860] hover:text-[#1A1A1A] shrink-0"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}

        <div className="w-px h-5 bg-[#E2DDD3] mx-1 shrink-0" aria-hidden="true" />

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          aria-label="Use my current location"
          title="Check my location and load climate statement"
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F2EEE6] disabled:opacity-60 rounded-r-lg transition-colors shrink-0 cursor-pointer"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F6C9F]" aria-hidden="true" />
          ) : (
            <LocateFixed className="w-3.5 h-3.5 text-[#2F6C9F]" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">My location</span>
        </button>
      </form>

      {/* Autocomplete / Coordinate Dropdown */}
      {showDropdown && (
        <div
          id="map-search-results"
          role="listbox"
          aria-label="Matching locations"
          className="mt-1.5 bg-white border border-[#D8D3C8] rounded-lg shadow-lg overflow-hidden divide-y divide-[#E2DDD3] max-h-64 overflow-y-auto"
        >
          {parsedCoords.status === 'valid' && (
            <button
              type="button"
              role="option"
              aria-selected={true}
              onClick={() => {
                setIsOpen(false);
                setResults([]);
                onSelectLocation({ lat: parsedCoords.lat, lon: parsedCoords.lon });
              }}
              className="w-full text-left px-3 py-2.5 text-xs hover:bg-[#F2EEE6] flex items-center justify-between gap-3 cursor-pointer"
            >
              <span className="inline-flex items-center gap-2 font-medium text-[#1A1A1A]">
                <MapPin className="w-3.5 h-3.5 text-[#C8472B] shrink-0" aria-hidden="true" />
                <span>Analyze coordinates</span>
              </span>
              <span className="text-[#52504A] tabular-nums shrink-0">
                {parsedCoords.lat.toFixed(2)}°, {parsedCoords.lon.toFixed(2)}°
              </span>
            </button>
          )}

          {isSearching && results.length === 0 && parsedCoords.status === 'not_coords' && (
            <div className="px-3 py-2.5 text-xs text-[#6B6860]">Searching places...</div>
          )}

          {results.map((place, idx) => (
            <button
              key={place.id}
              type="button"
              role="option"
              aria-selected={idx === highlightedIdx}
              onClick={() => selectPlace(place)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-baseline justify-between gap-3 cursor-pointer ${
                idx === highlightedIdx ? 'bg-[#F2EEE6]' : 'hover:bg-[#FAF8F4]'
              }`}
            >
              <div className="min-w-0">
                <div className="font-medium text-[#1A1A1A] truncate">{place.label}</div>
                {place.subtitle && (
                  <div className="text-[11px] text-[#6B6860] truncate">{place.subtitle}</div>
                )}
              </div>
              <span className="text-[11px] text-[#6B6860] tabular-nums shrink-0">
                {place.lat.toFixed(2)}°, {place.lon.toFixed(2)}°
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Honest Geolocation / Search Status or Error Notice */}
      {notice && (
        <div
          role={notice.type === 'error' ? 'alert' : 'status'}
          className={`mt-1.5 px-3 py-2 rounded-md border text-xs shadow-sm flex items-start justify-between gap-2 ${
            notice.type === 'error'
              ? 'bg-[#FDF8F6] border-[#E2C9C2] text-[#7D2B19]'
              : 'bg-white/95 border-[#D8D3C8] text-[#1A1A1A]'
          }`}
        >
          <div className="flex items-start gap-1.5">
            {notice.type === 'error' && (
              <AlertCircle className="w-3.5 h-3.5 text-[#C8472B] shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span className="leading-snug">{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss location notice"
            className="text-[#6B6860] hover:text-[#1A1A1A] p-0.5 shrink-0"
          >
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};
