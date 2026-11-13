import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { SeriesStats } from '../types/api.ts';
import { formatDecadalRate } from '../lib/format.ts';

interface TimeSeriesChartProps {
  title: string;
  variableName: string;
  years: number[];
  stats: SeriesStats;
  chartType?: 'line' | 'bar';
  color: string;
  trendColor: string;
}

const isValidNum = (val: unknown): val is number =>
  typeof val === 'number' && !Number.isNaN(val);

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  title,
  variableName,
  years,
  stats,
  color,
  trendColor,
}) => {
  if (!stats || !Array.isArray(years) || !Array.isArray(stats.values) || years.length === 0) {
    return null;
  }

  const valuesOnly = stats.values.filter(isValidNum);
  if (valuesOnly.length === 0) {
    return null;
  }

  const hasTrendParams =
    isValidNum(stats.intercept) && isValidNum(stats.sen_slope_per_year);
  const isSignificant =
    stats.confidence !== 'No significant trend' && hasTrendParams;
  const unit = stats.unit || '';

  const chartData = years.map((year, i) => {
    const rawVal = stats.values[i];
    const dataPoint: {
      year: number;
      actual?: number;
      trend?: number;
    } = {
      year,
    };

    if (isValidNum(rawVal)) {
      dataPoint.actual = rawVal;
    }

    if (isSignificant) {
      const trendVal = stats.intercept + stats.sen_slope_per_year * i;
      if (isValidNum(trendVal)) {
        dataPoint.trend = Number(trendVal.toFixed(3));
      }
    }

    return dataPoint;
  });

  const minVal = Math.min(...valuesOnly);
  const maxVal = Math.max(...valuesOnly);
  const range = maxVal - minVal || 1;
  const yDomain: [number, number] = [
    Number((minVal - range * 0.12).toFixed(1)),
    Number((maxVal + range * 0.14).toFixed(1)),
  ];

  const lastIdx = chartData.length - 1;
  const lastActual = chartData[lastIdx]?.actual;
  const lastTrend = chartData[lastIdx]?.trend;
  const labelsClose =
    isSignificant &&
    isValidNum(lastActual) &&
    isValidNum(lastTrend) &&
    Math.abs(lastActual - lastTrend) < range * 0.14;

  const actualLabelDy =
    labelsClose && isValidNum(lastActual) && isValidNum(lastTrend)
      ? lastActual >= lastTrend
        ? -8
        : 10
      : 3;
  const trendLabelDy =
    labelsClose && isValidNum(lastActual) && isValidNum(lastTrend)
      ? lastTrend > lastActual
        ? -8
        : 10
      : 3;

  const hasPeriod = isValidNum(stats.first_year) && isValidNum(stats.last_year);
  const hasDecadeSlope = isValidNum(stats.sen_slope_per_decade) && Boolean(unit);

  const screenReaderSummary = `${title}: ${stats.trend_direction || 'unknown'} trend${
    hasDecadeSlope
      ? ` at ${formatDecadalRate(stats.sen_slope_per_decade, unit)}`
      : ''
  }${stats.confidence ? ` with ${stats.confidence} confidence` : ''}${
    hasPeriod ? `. Spans from ${stats.first_year} to ${stats.last_year}.` : '.'
  }`;

  return (
    <div className="pt-2 pb-1 flex flex-col" aria-label={title}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <div className="text-xs font-medium text-[#52504A]">
          {title}
          {hasPeriod ? ` (${stats.first_year}–${stats.last_year})` : ''}
        </div>
        {unit && (
          <div className="text-xs text-[#6B6860] tabular-nums">
            Annual mean ({unit})
          </div>
        )}
      </div>

      <div className="w-full h-56 sm:h-64 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 18, right: 78, left: -8, bottom: 4 }}
          >
            <CartesianGrid vertical={false} stroke="#E6E1D6" strokeWidth={1} />
            <XAxis
              dataKey="year"
              stroke="#D5CFC3"
              tick={{ fontSize: 11, fill: '#6B6860' }}
              tickLine={false}
              axisLine={{ stroke: '#D5CFC3' }}
              minTickGap={24}
            />
            <YAxis
              domain={yDomain}
              stroke="#D5CFC3"
              tick={{ fontSize: 11, fill: '#6B6860' }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#FAF8F4] border border-[#D8D3C8] px-3 py-2 rounded-md shadow-sm text-xs text-[#1A1A1A]">
                      <div className="font-semibold text-[#1A1A1A] mb-1 pb-1 border-b border-[#E2DDD3] tabular-nums">
                        {label}
                      </div>
                      <div className="space-y-0.5">
                        {payload.map((entry, index) => (
                          <div
                            key={`item-${index}`}
                            className="flex items-center justify-between gap-4"
                          >
                            <span className="text-[#52504A]">{entry.name}:</span>
                            <span
                              className="tabular-nums font-semibold"
                              style={{ color: entry.color }}
                            >
                              {typeof entry.value === 'number' && Number.isFinite(entry.value)
                                ? entry.value.toFixed(2)
                                : entry.value}
                              {unit ? ` ${unit}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Line
              type="monotone"
              dataKey="actual"
              name={`Observed ${variableName}`}
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: '#FAF8F4', strokeWidth: 1.5 }}
              isAnimationActive={false}
              label={(props: { x?: string | number; y?: string | number; index?: number }) => {
                const px = typeof props.x === 'number' ? props.x : Number(props.x);
                const py = typeof props.y === 'number' ? props.y : Number(props.y);
                if (props.index !== lastIdx || !Number.isFinite(px) || !Number.isFinite(py)) {
                  return <g />;
                }
                return (
                  <text
                    x={px + 6}
                    y={py + actualLabelDy}
                    fill={color}
                    fontSize={11}
                    fontWeight={600}
                    textAnchor="start"
                  >
                    Annual mean
                  </text>
                );
              }}
            />

            {isSignificant && (
              <Line
                type="linear"
                dataKey="trend"
                name="Sen's trend"
                stroke={trendColor}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
                label={(props: { x?: string | number; y?: string | number; index?: number }) => {
                  const px = typeof props.x === 'number' ? props.x : Number(props.x);
                  const py = typeof props.y === 'number' ? props.y : Number(props.y);
                  if (props.index !== lastIdx || !Number.isFinite(px) || !Number.isFinite(py)) {
                    return <g />;
                  }
                  return (
                    <text
                      x={px + 6}
                      y={py + trendLabelDy}
                      fill={trendColor}
                      fontSize={11}
                      fontWeight={500}
                      textAnchor="start"
                    >
                      Sen's trend
                    </text>
                  );
                }}
              />
            )}

            {stats.change_point_significant && isValidNum(stats.pettitt_year) && (
              <ReferenceLine
                x={stats.pettitt_year}
                stroke="#7A766E"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={(labelProps: { viewBox?: { x?: number; y?: number } }) => {
                  const vbX = labelProps.viewBox?.x;
                  const vbY = labelProps.viewBox?.y;
                  if (typeof vbX !== 'number' || typeof vbY !== 'number') {
                    return null;
                  }
                  const text = `Shift ~${stats.pettitt_year}`;
                  const boxW = text.length * 6 + 10;
                  const boxH = 16;
                  const rectX = Math.max(46, vbX - boxW / 2);
                  const rectY = vbY + 2;
                  return (
                    <g>
                      <rect
                        x={rectX}
                        y={rectY}
                        width={boxW}
                        height={boxH}
                        rx={2}
                        fill="#FAF8F4"
                        fillOpacity={0.94}
                      />
                      <text
                        x={rectX + boxW / 2}
                        y={rectY + 11.5}
                        textAnchor="middle"
                        fill="#52504A"
                        fontSize={10.5}
                        fontWeight={500}
                      >
                        {text}
                      </text>
                    </g>
                  );
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1.5 text-xs text-[#6B6860]">
        {isSignificant ? (
          <span>
            Dashed line shows Sen's slope
            {hasDecadeSlope
              ? ` (${formatDecadalRate(stats.sen_slope_per_decade, unit).replace(' / decade', ' per decade')})`
              : ''}
            .
          </span>
        ) : (
          <span>No significant trend line drawn (adjusted p ≥ 0.05).</span>
        )}
        <p className="sr-only">{screenReaderSummary}</p>
      </div>
    </div>
  );
};
