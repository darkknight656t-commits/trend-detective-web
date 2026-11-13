import React from 'react';
import { SeriesStats } from '../types/api.ts';

interface ChangePointCalloutProps {
  stats: SeriesStats;
  variableName: string;
}

const isValidNum = (val: unknown): val is number =>
  typeof val === 'number' && !Number.isNaN(val);

export const ChangePointCallout: React.FC<ChangePointCalloutProps> = ({
  stats,
  variableName,
}) => {
  // Rendered ONLY if change_point_significant === true and pettitt_year is present
  if (!stats?.change_point_significant || !isValidNum(stats.pettitt_year)) {
    return null;
  }

  const unit = stats.unit || '';
  const hasMeans = isValidNum(stats.mean_before) && isValidNum(stats.mean_after);
  const beforeStr = hasMeans
    ? `${stats.mean_before!.toFixed(2)}${unit ? ` ${unit}` : ''}`
    : '';
  const afterStr = hasMeans
    ? `${stats.mean_after!.toFixed(2)}${unit ? ` ${unit}` : ''}`
    : '';

  return (
    <div
      role="note"
      className="bg-[#F3EFE7] border border-[#E2DDD3] rounded-md px-4 py-3 text-[13px] text-[#52504A] leading-relaxed"
    >
      <div className="font-medium text-[#1A1A1A] mb-0.5">
        {variableName} level shift (Pettitt test)
      </div>
      <p>
        The average level shifted around{' '}
        <strong className="font-semibold text-[#1A1A1A] tabular-nums">{stats.pettitt_year}</strong>
        {hasMeans && (
          <>
            {' '}
            (before: <span className="tabular-nums text-[#1A1A1A]">{beforeStr}</span>, after:{' '}
            <span className="tabular-nums text-[#1A1A1A]">{afterStr}</span>)
          </>
        )}
        . This can reflect real change <strong className="font-semibold text-[#1A1A1A]">or</strong>{' '}
        changes in the satellite data feeding the reanalysis, so treat it as a lead to investigate,
        not a finding.
      </p>
    </div>
  );
};
