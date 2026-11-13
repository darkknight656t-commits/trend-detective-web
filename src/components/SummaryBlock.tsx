import React from 'react';
import { AnalysisResponse } from '../types/api.ts';
import { ConfidenceBadge } from './ConfidenceBadge.tsx';

interface SummaryBlockProps {
  data: AnalysisResponse;
}

export const SummaryBlock: React.FC<SummaryBlockProps> = ({ data }) => {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-[#E2DDD3]">
        <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#1A1A1A]">
          What the data show
        </h3>
        <span className="text-xs text-[#6B6860]">
          Source: {data.meta?.source || 'NASA POWER (MERRA-2)'}
        </span>
      </div>

      <div className="space-y-2.5 text-[15px] leading-relaxed text-[#1A1A1A]">
        {data.summary && data.summary.length > 0 ? (
          data.summary.map((sentence, idx) => (
            <p key={idx}>{sentence}</p>
          ))
        ) : (
          <p className="text-[#6B6860] italic">No summary text returned from server.</p>
        )}
      </div>

      {(data.temperature?.confidence || data.precipitation?.confidence) && (
        <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {data.temperature?.confidence && (
            <ConfidenceBadge
              variableName="Temperature"
              confidence={data.temperature.confidence}
            />
          )}
          {data.precipitation?.confidence && (
            <ConfidenceBadge
              variableName="Precipitation"
              confidence={data.precipitation.confidence}
            />
          )}
        </div>
      )}
    </section>
  );
};
