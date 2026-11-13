import React from 'react';
import { ApiError, ERROR_MESSAGES } from '../lib/api.ts';
import { ApiErrorCode } from '../types/api.ts';
import { AlertOctagon, RotateCw } from 'lucide-react';

interface ErrorStateProps {
  error: ApiError | Error;
  onRetry: () => void;
  locationName?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, locationName }) => {
  const code = (('code' in error ? error.code : 'GENERIC_ERROR') as ApiErrorCode) || 'GENERIC_ERROR';
  const message = ERROR_MESSAGES[code] || error.message || ERROR_MESSAGES.GENERIC_ERROR;

  const getActionHint = () => {
    switch (code) {
      case 'POWER_EMPTY':
        return 'Tip: NASA POWER returned no coverage at this grid cell. Try clicking a nearby location.';
      case 'INSUFFICIENT_DATA':
        return 'Try clicking another nearby location.';
      case 'RATE_LIMITED':
        return 'The NASA gateway is experiencing high request volume. Please wait a moment and try again.';
      case 'INVALID_COORDINATES':
        return 'Select a valid point directly on the interactive map.';
      case 'TIMEOUT':
      case 'POWER_UNAVAILABLE':
      case 'NETWORK_ERROR':
      default:
        return 'No synthetic or estimated numbers are shown when data cannot be retrieved. You may retry now.';
    }
  };

  return (
    <div
      role="alert"
      className="p-5 sm:p-6 bg-[#FDF8F6] border border-[#E2C9C2] rounded-md space-y-4 text-[#1A1A1A]"
    >
      <div className="flex items-start gap-3">
        <AlertOctagon className="w-5 h-5 text-[#C8472B] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6860] tabular-nums">
            <span className="font-medium text-[#9E2F1A]">{code}</span>
            {locationName && (
              <>
                <span aria-hidden="true">·</span>
                <span>{locationName}</span>
              </>
            )}
          </div>
          <h4 className="font-serif text-lg font-semibold text-[#1A1A1A] leading-snug">
            {message}
          </h4>
        </div>
      </div>

      <p className="text-xs text-[#52504A] leading-relaxed pt-3 border-t border-[#E2C9C2]">
        {getActionHint()}
      </p>

      <div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1A1A1A] hover:bg-[#33312E] text-[#FAF8F4] font-medium text-xs transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Try again</span>
        </button>
      </div>
    </div>
  );
};
