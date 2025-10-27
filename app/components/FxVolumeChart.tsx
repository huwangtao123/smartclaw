"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import { useMemo, useRef, useState } from "react";

import {
  type DailyVolumeRecord,
  METRIC_CONFIGS,
  type MetricConfig,
  type MetricId,
} from "@/lib/fxVolume";

const CHART_HEIGHT = 260;
const MARGIN = { top: 36, right: 32, bottom: 84, left: 72 };
const BAR_WIDTH = 7;
const BAR_GAP = 4;
const GROUP_PADDING = 8;
const LONG_METRIC_IDS: MetricId[] = ["openLong", "closeLong"];
const SHORT_METRIC_IDS: MetricId[] = ["openShort", "closeShort"];

type FxVolumeChartProps = {
  token: string;
  data: DailyVolumeRecord[];
  subtitle?: string;
};

function niceNumber(range: number, round: boolean) {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / 10 ** exponent;
  let niceFraction: number;

  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * 10 ** exponent;
}

function computeTicks(maxValue: number) {
  if (maxValue <= 0) return [0, 1];

  const niceMax = niceNumber(maxValue, false);
  const rawSpacing = niceMax / 4;
  const tickSpacing = niceNumber(rawSpacing, true);

  const ticks: number[] = [];
  for (let tick = 0; tick <= niceMax + tickSpacing / 2; tick += tickSpacing) {
    ticks.push(Number(tick.toFixed(6)));
  }

  return ticks;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  if (value === 0) return "0";
  return value.toFixed(2);
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
type HoverState = {
  point: DailyVolumeRecord;
  position: { x: number; y: number };
};

function formatPercentShare(value: number) {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function FxVolumeChart({ token, data, subtitle }: FxVolumeChartProps) {
  const [activeMetricIds, setActiveMetricIds] = useState<MetricId[]>(() =>
    METRIC_CONFIGS.map((metric) => metric.id),
  );
  const [isStacked, setIsStacked] = useState(false);
  const [hoverState, setHoverState] = useState<HoverState | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const summary = useMemo(() => {
    const points = data ?? [];
    let longTotal = 0;
    let shortTotal = 0;

    for (const point of points) {
      for (const metricId of LONG_METRIC_IDS) {
        const value = Math.max(0, point.metrics[metricId] ?? 0);
        longTotal += Number.isFinite(value) ? value : 0;
      }
      for (const metricId of SHORT_METRIC_IDS) {
        const value = Math.max(0, point.metrics[metricId] ?? 0);
        shortTotal += Number.isFinite(value) ? value : 0;
      }
    }

    const total = longTotal + shortTotal;
    return {
      longTotal,
      shortTotal,
      total,
      longShare: total > 0 ? longTotal / total : 0,
      shortShare: total > 0 ? shortTotal / total : 0,
    };
  }, [data]);

  const activeMetrics = useMemo(
    () =>
      METRIC_CONFIGS.filter((metric) => activeMetricIds.includes(metric.id)),
    [activeMetricIds],
  );

  const chart = useMemo(() => {
    const points = data ?? [];
    const visibleMetrics =
      activeMetrics.length > 0 ? activeMetrics : METRIC_CONFIGS;

    const processedPoints = points.map((point) => {
      const entries = visibleMetrics.map((metric) => ({
        metric,
        value: Math.max(0, point.metrics[metric.id] ?? 0),
      }));
      const total = entries.reduce((acc, entry) => acc + entry.value, 0);
      return {
        ...point,
        entries,
        total,
      };
    });

    const maxEntryValue = processedPoints.reduce((max, point) => {
      const entryMax = point.entries.reduce(
        (innerMax, entry) => Math.max(innerMax, entry.value),
        0,
      );
      return Math.max(max, entryMax);
    }, 0);

    const maxTotalValue = processedPoints.reduce(
      (max, point) => Math.max(max, point.total),
      0,
    );

    const ceiling = isStacked
      ? maxTotalValue
      : Math.max(maxEntryValue, maxTotalValue);
    const safeMax = ceiling > 0 ? ceiling : 1;
    const ticks = computeTicks(safeMax);
    const paddedMax = ticks[ticks.length - 1] ?? safeMax;

    const metricsCount = isStacked
      ? 1
      : visibleMetrics.length > 0
        ? visibleMetrics.length
        : METRIC_CONFIGS.length;

    const metricsBandWidth =
      metricsCount * BAR_WIDTH + (metricsCount - 1) * BAR_GAP;

    const groupWidth = GROUP_PADDING * 2 + metricsBandWidth;
    const pointCount = Math.max(processedPoints.length, 1);
    const width = MARGIN.left + MARGIN.right + pointCount * groupWidth;
    const height = CHART_HEIGHT + MARGIN.top + MARGIN.bottom;

    return {
      width,
      height,
      groupWidth,
      ticks,
      paddedMax,
      processedPoints,
      metricsBandWidth,
    };
  }, [activeMetrics, data, isStacked]);

  const {
    width,
    height,
    groupWidth,
    ticks,
    paddedMax,
    processedPoints,
    metricsBandWidth,
  } = chart;

  const chartAreaWidth = width - MARGIN.left - MARGIN.right;
  const allMetricConfigs: MetricConfig[] = METRIC_CONFIGS;
  const hoveredDate = hoverState?.point.date ?? null;
  const containerWidth = containerRef.current?.offsetWidth ?? 0;

  const tooltipPosition =
    hoverState && containerWidth
      ? {
          left: Math.min(
            Math.max(hoverState.position.x + 16, 12),
            Math.max(containerWidth - 220, 12),
          ),
          top: Math.max(hoverState.position.y - 140, 12),
        }
      : hoverState
        ? {
            left: hoverState.position.x + 16,
            top: Math.max(hoverState.position.y - 140, 12),
          }
        : null;

  const tooltipPoint =
    hoverState?.point !== undefined
      ? processedPoints.find((point) => point.date === hoverState.point.date)
      : null;

  const tooltipMetrics =
    tooltipPoint?.entries.map((entry) => ({
      metric: entry.metric,
      value: entry.value,
    })) ?? [];

  const tooltipTotal = tooltipMetrics.reduce(
    (acc, entry) => acc + entry.value,
    0,
  );
  const tooltipDate =
    hoverState?.point !== undefined
      ? DATE_FORMATTER.format(new Date(`${hoverState.point.date}T00:00:00Z`))
      : null;

  function handleToggle(metricId: MetricId) {
    setActiveMetricIds((prev) => {
      const isActive = prev.includes(metricId);
      if (isActive) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== metricId);
      }
      const nextSet = new Set(prev);
      nextSet.add(metricId);
      return METRIC_CONFIGS.filter((metric) => nextSet.has(metric.id)).map(
        (metric) => metric.id,
      );
    });
  }

  function handlePointer(
    event: ReactMouseEvent<SVGElement>,
    point: DailyVolumeRecord,
  ) {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setHoverState({
      point,
      position: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/10 via-slate-900/70 to-slate-950/80 p-6 shadow-[0_0_90px_-50px_rgba(16,185,129,0.6)]">
      <div className="flex flex-col gap-3 text-emerald-100">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-emerald-50">
            {token} Daily Volume
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-emerald-100/70">
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 font-semibold uppercase tracking-[0.32em]">
              24h Bars
            </span>
            <span className="text-emerald-100/70">
              {subtitle ?? "Grouped by position events · UTC"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.24em] text-emerald-100/70">
          <span className="font-semibold text-emerald-200/80">
            30d Total Volume{" "}
            <span className="ml-2 text-sm font-semibold text-emerald-50">
              {formatNumber(summary.total)}
            </span>
          </span>
          <span className="text-emerald-100/70">
            Long {formatPercentShare(summary.longShare)} · Short{" "}
            {formatPercentShare(summary.shortShare)}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-50">
            <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-200/80">
              Long Flow
            </p>
            <p className="mt-2 text-lg font-semibold text-emerald-50">
              {formatNumber(summary.longTotal)}
            </p>
            <p className="mt-1 text-[11px] text-emerald-100/70">
              {formatPercentShare(summary.longShare)} of 30d total
            </p>
          </div>
          <div className="rounded-2xl border border-sky-300/20 bg-sky-500/10 p-4 text-sm text-emerald-50">
            <p className="text-[10px] uppercase tracking-[0.3em] text-sky-200/80">
              Short Flow
            </p>
            <p className="mt-2 text-lg font-semibold text-emerald-50">
              {formatNumber(summary.shortTotal)}
            </p>
            <p className="mt-1 text-[11px] text-emerald-100/70">
              {formatPercentShare(summary.shortShare)} of 30d total
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
          {allMetricConfigs.map((metric) => {
            const isActive = activeMetricIds.includes(metric.id);
            return (
              <button
                key={metric.id}
                type="button"
                onClick={() => handleToggle(metric.id)}
                aria-pressed={isActive}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                  isActive
                    ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-50 shadow-[0_0_25px_-10px_rgba(16,185,129,0.6)]"
                    : "border-white/10 bg-white/5 text-emerald-100/50 hover:border-emerald-300/40 hover:text-emerald-100"
                }`}
              >
                <span
                  aria-hidden
                  className="block h-2 w-2 rounded-full"
                  style={{ backgroundColor: metric.color }}
                />
                <span className="uppercase tracking-[0.2em]">
                  {metric.label}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-pressed={isStacked}
          onClick={() => setIsStacked((prev) => !prev)}
          className={`rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] transition ${
            isStacked
              ? "border-sky-400/70 bg-sky-500/20 text-sky-50 shadow-[0_0_25px_-10px_rgba(56,189,248,0.6)]"
              : "border-white/10 bg-white/5 text-emerald-100/70 hover:border-sky-300/40 hover:text-emerald-50"
          }`}
        >
          {isStacked ? "Stacked Bars" : "Grouped Bars"}
        </button>
      </div>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl border border-white/5 bg-slate-950/40 p-4"
      >
        <svg
          width="100%"
          height={height}
          role="img"
          viewBox={`0 0 ${width} ${height}`}
          onMouseLeave={() => setHoverState(null)}
        >
          <title>{`${token} daily volume chart`}</title>
          <desc>{`Chart showing ${token} volume split across position lifecycle events.`}</desc>

          {/* axes */}
          <line
            x1={MARGIN.left}
            x2={MARGIN.left}
            y1={MARGIN.top}
            y2={height - MARGIN.bottom}
            stroke="rgba(148, 163, 184, 0.3)"
            strokeWidth={1}
          />

          <line
            x1={MARGIN.left}
            x2={width - MARGIN.right}
            y1={height - MARGIN.bottom}
            y2={height - MARGIN.bottom}
            stroke="rgba(148, 163, 184, 0.3)"
            strokeWidth={1}
          />

          {/* horizontal grid + ticks */}
          {ticks.map((tick) => {
            const y = MARGIN.top + (1 - tick / paddedMax) * CHART_HEIGHT;
            return (
              <g key={`tick-${tick}`}>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.12)"
                  strokeWidth={1}
                />
                <text
                  x={MARGIN.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-semibold"
                >
                  {formatNumber(tick)}
                </text>
              </g>
            );
          })}

          {/* bars */}
          {processedPoints.map((point, index) => {
            const groupStart = MARGIN.left + index * groupWidth + GROUP_PADDING;
            const groupCenter = groupStart + metricsBandWidth / 2;
            const isHovered = hoveredDate === point.date;
            const isDimmed = hoveredDate && hoveredDate !== point.date;
            const entries = point.entries;

            return (
              <g key={`day-${point.date}`} opacity={isDimmed ? 0.35 : 1}>
                {/* biome-ignore lint/a11y/noStaticElementInteractions: SVG bar group needs pointer events for tooltip */}
                <rect
                  x={groupStart - GROUP_PADDING}
                  y={MARGIN.top}
                  width={metricsBandWidth + GROUP_PADDING * 2}
                  height={CHART_HEIGHT}
                  rx={8}
                  fill={isHovered ? "rgba(16, 185, 129, 0.12)" : "transparent"}
                  stroke={
                    isHovered ? "rgba(16, 185, 129, 0.35)" : "transparent"
                  }
                  strokeWidth={isHovered ? 1 : 0}
                  onMouseEnter={(event) => handlePointer(event, point)}
                  onMouseMove={(event) => handlePointer(event, point)}
                  onMouseLeave={() => setHoverState(null)}
                />
                {isStacked
                  ? (() => {
                      let cumulativeHeight = 0;
                      const baseX =
                        groupStart + (metricsBandWidth - BAR_WIDTH) / 2;
                      return entries.map((entry) => {
                        const barHeight =
                          paddedMax > 0
                            ? (entry.value / paddedMax) * CHART_HEIGHT
                            : 0;
                        const y =
                          MARGIN.top +
                          (CHART_HEIGHT - cumulativeHeight - barHeight);
                        cumulativeHeight += barHeight;
                        return (
                          /* biome-ignore lint/a11y/noStaticElementInteractions: bar segment needs hover events for tooltip */
                          <rect
                            key={`${point.date}-${entry.metric.id}`}
                            x={baseX}
                            y={y}
                            width={BAR_WIDTH}
                            height={barHeight}
                            rx={2}
                            fill={entry.metric.color}
                            opacity={0.9}
                            onMouseEnter={(event) =>
                              handlePointer(event, point)
                            }
                            onMouseMove={(event) => handlePointer(event, point)}
                            onMouseLeave={() => setHoverState(null)}
                          >
                            <title>
                              {`${entry.metric.label} on ${point.date}: ${formatNumber(entry.value)}`}
                            </title>
                          </rect>
                        );
                      });
                    })()
                  : entries.map((entry, metricIndex) => {
                      const barHeight =
                        paddedMax > 0
                          ? (entry.value / paddedMax) * CHART_HEIGHT
                          : 0;
                      const x =
                        groupStart + metricIndex * (BAR_WIDTH + BAR_GAP);
                      const y = MARGIN.top + (CHART_HEIGHT - barHeight);

                      return (
                        /* biome-ignore lint/a11y/noStaticElementInteractions: bar segment needs hover events for tooltip */
                        <rect
                          key={`${point.date}-${entry.metric.id}`}
                          x={x}
                          y={y}
                          width={BAR_WIDTH}
                          height={barHeight}
                          rx={2}
                          fill={entry.metric.color}
                          opacity={0.9}
                          onMouseEnter={(event) => handlePointer(event, point)}
                          onMouseMove={(event) => handlePointer(event, point)}
                          onMouseLeave={() => setHoverState(null)}
                        >
                          <title>
                            {`${entry.metric.label} on ${point.date}: ${formatNumber(entry.value)}`}
                          </title>
                        </rect>
                      );
                    })}

                <line
                  x1={groupStart - GROUP_PADDING / 2}
                  x2={groupStart - GROUP_PADDING / 2}
                  y1={MARGIN.top}
                  y2={height - MARGIN.bottom}
                  stroke="rgba(148,163,184,0.08)"
                  strokeWidth={1}
                />

                <text
                  x={groupCenter}
                  y={height - MARGIN.bottom + 18}
                  textAnchor="middle"
                  transform={`rotate(-35, ${groupCenter}, ${height - MARGIN.bottom + 18})`}
                  className="fill-slate-400 text-[10px] font-medium"
                >
                  {DATE_FORMATTER.format(new Date(`${point.date}T00:00:00Z`))}
                </text>
              </g>
            );
          })}

          {/* x-axis label */}
          <text
            x={MARGIN.left + chartAreaWidth / 2}
            y={height - 24}
            textAnchor="middle"
            className="fill-slate-400 text-[11px] uppercase tracking-[0.3em]"
          >
            Date (UTC)
          </text>

          {/* y-axis label */}
          <text
            x={18}
            y={MARGIN.top + CHART_HEIGHT / 2}
            textAnchor="middle"
            transform={`rotate(-90, 18, ${MARGIN.top + CHART_HEIGHT / 2})`}
            className="fill-slate-400 text-[11px] uppercase tracking-[0.35em]"
          >
            Volume
          </text>
        </svg>
        {hoverState && tooltipPosition ? (
          <div
            className="pointer-events-none absolute z-10 min-w-[200px] rounded-2xl border border-emerald-400/40 bg-slate-950/95 p-4 text-xs text-emerald-50 shadow-[0_30px_60px_-25px_rgba(16,185,129,0.6)]"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
            }}
          >
            <div className="text-[11px] uppercase tracking-[0.3em] text-emerald-200/80">
              {tooltipDate}
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {tooltipMetrics.map(({ metric, value }) => (
                <div
                  key={`${hoverState.point.date}-${metric.id}`}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 text-emerald-100/80">
                    <span
                      aria-hidden
                      className="block h-2 w-2 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                    <span>{metric.label}</span>
                  </div>
                  <span className="font-semibold text-emerald-50">
                    {formatNumber(value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-emerald-400/20 pt-2 text-[11px] uppercase tracking-[0.24em] text-emerald-100/70">
              Total {formatNumber(tooltipTotal)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
