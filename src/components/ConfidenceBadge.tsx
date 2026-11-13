import React from 'react';
import { ConfidenceLevel } from '../types/api.ts';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  variableName: 'Temperature' | 'Precipitation';
}

const ConfidenceDot: React.FC<{ level: ConfidenceLevel; color: string }> = ({ level, color }) => {
  if (level === 'Strong') {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
        <circle cx="5" cy="5" r="4" fill={color} />
      </svg>
    );
  }
  if (level === 'Weak') {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
        <circle cx="5" cy="5" r="4" fill="none" stroke={color} strokeWidth="1.25" />
        <path d="M 5 1 A 4 4 0 0 0 5 9 Z" fill={color} />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
      <circle cx="5" cy="5" r="4" fill="none" stroke={color} strokeWidth="1.25" />
    </svg>
  );
};

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  variableName,
}) => {
  const fullLabel =
    variableName === 'Temperature'
      ? 'Air temperature at 2 m (T2M)'
      : 'Precipitation (PRECTOTCORR, bias-corrected)';

  const dotColor =
    confidence === 'No significant trend'
      ? '#6B6860'
      : variableName === 'Temperature'
      ? '#C8472B'
      : '#2F6C9F';

  const tooltip =
    confidence === 'Strong'
      ? `${fullLabel}: Adjusted p < 0.01 (Strong statistical support)`
      : confidence === 'Weak'
      ? `${fullLabel}: 0.01 <= Adjusted p < 0.05 (Weak statistical support)`
      : `${fullLabel}: Adjusted p >= 0.05 (No statistically significant trend detected)`;

  const labelText =
    confidence === 'Strong'
      ? `${variableName}: Strong confidence`
      : confidence === 'Weak'
      ? `${variableName}: Weak confidence`
      : `${variableName}: No significant trend`;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-[#52504A]"
      title={tooltip}
    >
      <ConfidenceDot level={confidence} color={dotColor} />
      <span>{labelText}</span>
    </span>
  );
};
