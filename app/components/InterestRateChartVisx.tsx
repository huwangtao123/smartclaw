"use client";

import { AxisBottom, AxisLeft } from "@visx/axis";
import { localPoint } from "@visx/event";
import { GridRows } from "@visx/grid";
import { scaleLinear, scaleTime } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { useTooltip, useTooltipInPortal } from "@visx/tooltip";
import type {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
} from "react";
import { useMemo, useState } from "react";

import type { RatePoint } from "@/lib/rates";

type RangeOption = { id: string; label: string; days: number | null };

export const RANGE_OPTIONS: RangeOption[] = [
  { id: "max", label: "All", days: null },
  { id: "1y", label: "1Y", days: 365 },
  { id: "6m", label: "6M", days: 182 },
  { id: "3m", label: "3M", days: 90 },
  { id: "1m", label: "1M", days: 30 },
];

const COLORS = {
  aave: "#60a5fa",
  aaveMa: "#2563eb",
  crv: "#34d399",
  crvMa: "#059669",
  fx: "#f97316",
  fxMa: "#ea580c",
  grid: "rgba(148,163,184,0.25)",
};

const HEIGHT = 360;
const MARGIN = { top: 24, right: 20, bottom: 48, left: 56 };

type ChartPoint = {
  date: Date;
  aave: number | null;
  crv: number | null;
  fx: number | null;
  aaveMa?: number;
  crvMa?: number;
  fxMa?: number;
};

type HoverDatum = {
  point: ChartPoint;
  index: number;
};

export type InterestRateChartVisxProps = {
  series: RatePoint[];
  maWindow: number;
  lastUpdated: string | null;
  source: string;
  language?: "en" | "zh";
  selectedRangeId?: string;
  onRangeChange?: (rangeId: string) => void;
  rangeHint?: string;
};

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}

function formatDate(date: Date, locale: string = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function filterByRange(points: ChartPoint[], rangeId: string) {
  const option = RANGE_OPTIONS.find((opt) => opt.id === rangeId);
  if (!option) return points;
  const days = option.days;
  if (!days) return points;
  const latest = points[points.length - 1]?.date ?? new Date();
  const cutoff = new Date(latest);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return points.filter((point) => point.date >= cutoff && point.date <= latest);
}

function findClosestIndex(
  points: ChartPoint[],
  x: number,
  scaleX: (d: Date) => number,
) {
  if (points.length === 0) return 0;
  let closest = 0;
  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i += 1) {
    const px = scaleX(points[i].date);
    const dist = Math.abs(px - x);
    if (dist < min) {
      min = dist;
      closest = i;
    }
  }
  return closest;
}

export function InterestRateChartVisx({
  series,
  maWindow,
  lastUpdated,
  source,
  language = "en",
  selectedRangeId = "1y",
  onRangeChange,
}: InterestRateChartVisxProps) {
  const [rangeId, setRangeId] = useState<string>(selectedRangeId);
  const [showAave, setShowAave] = useState(true);
  const [showCrv, setShowCrv] = useState(true);
  const [showFx, setShowFx] = useState(true);
  const [showMa, setShowMa] = useState(false);
  const locale = language === "zh" ? "zh-CN" : "en-US";

  const points = useMemo<ChartPoint[]>(() => {
    const mapped = (series ?? [])
      .map((point) => ({
        date: new Date(`${point.date}T00:00:00Z`),
        aave: point.aaveBorrow ?? null,
        crv: point.crvusdAvg ?? null,
        fx: point.fxusdBorrow ?? null,
        aaveMa: point.aaveMa,
        crvMa: point.crvusdMa,
        fxMa: point.fxusdMa,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return mapped;
  }, [series]);

  const filtered = useMemo(
    () => filterByRange(points, rangeId),
    [points, rangeId],
  );

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
  });

  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<HoverDatum>();

  if (!filtered.length) {
    return (
      <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-sm text-emerald-50">
        {language === "zh"
          ? "暂无利率数据可展示，请稍后重试或检查离线 CSV。"
          : "No lending rate data available. Try again later or provide an offline CSV snapshot."}
      </div>
    );
  }

  const xScale = scaleTime({
    domain: [filtered[0].date, filtered[filtered.length - 1].date],
    range: [MARGIN.left, 900 - MARGIN.right],
  });

  const maxValue = filtered.reduce((acc, point) => {
    const candidates = [
      showAave ? point.aave : null,
      showCrv ? point.crv : null,
      showFx ? point.fx : null,
      showMa && showAave ? point.aaveMa : null,
      showMa && showCrv ? point.crvMa : null,
      showMa && showFx ? point.fxMa : null,
    ].filter((v) => v !== null && v !== undefined) as number[];
    const localMax = candidates.length ? Math.max(...candidates) : 0;
    return Math.max(acc, localMax);
  }, 0);

  const yScale = scaleLinear({
    domain: [0, maxValue > 0 ? maxValue * 1.2 : 1],
    nice: true,
    range: [HEIGHT - MARGIN.bottom, MARGIN.top],
  });

  function handlePointerMove(
    event: ReactMouseEvent<SVGSVGElement> | ReactTouchEvent<SVGSVGElement>,
  ) {
    const coords = localPoint(event);
    if (!coords) return;
    const idx = findClosestIndex(filtered, coords.x, xScale);
    const point = filtered[idx];
    const firstVisible =
      (showAave && point.aave !== null ? point.aave : null) ??
      (showCrv && point.crv !== null ? point.crv : null) ??
      (showFx && point.fx !== null ? point.fx : null) ??
      (showMa && showAave && point.aaveMa !== undefined
        ? point.aaveMa
        : null) ??
      (showMa && showCrv && point.crvMa !== undefined ? point.crvMa : null) ??
      (showMa && showFx && point.fxMa !== undefined ? point.fxMa : null) ??
      0;
    showTooltip({
      tooltipData: { point, index: idx },
      tooltipLeft: xScale(point.date),
      tooltipTop: yScale(firstVisible),
    });
  }

  function handlePointerLeave() {
    hideTooltip();
  }

  return (
    <div className="rounded-3xl border border-emerald-400/30 bg-slate-900/60 p-4 shadow-[0_0_90px_-40px_rgba(16,185,129,0.6)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-emerald-100/80">
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setRangeId(opt.id);
                onRangeChange?.(opt.id);
              }}
              className={`rounded-full border px-3 py-1 ${
                rangeId === opt.id
                  ? "border-emerald-300 bg-emerald-400/20 text-emerald-50"
                  : "border-emerald-300/30 text-emerald-100/70 hover:border-emerald-200/60 hover:text-emerald-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1">
            <input
              type="checkbox"
              checked={showFx}
              onChange={(e) => setShowFx(e.target.checked)}
              className="accent-emerald-400"
            />
            <span className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: COLORS.fx }}
              />
              {language === "zh" ? "fxUSD" : "fxUSD"}
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1">
            <input
              type="checkbox"
              checked={showAave}
              onChange={(e) => setShowAave(e.target.checked)}
              className="accent-emerald-400"
            />
            <span className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: COLORS.aave }}
              />
              {language === "zh" ? "Aave USDC" : "Aave USDC"}
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1">
            <input
              type="checkbox"
              checked={showCrv}
              onChange={(e) => setShowCrv(e.target.checked)}
              className="accent-emerald-400"
            />
            <span className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: COLORS.crv }}
              />
              {language === "zh" ? "crvUSD(WBTC)" : "crvUSD(WBTC)"}
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1">
            <input
              type="checkbox"
              checked={showMa}
              onChange={(e) => setShowMa(e.target.checked)}
              className="accent-emerald-400"
            />
            <span>
              {language === "zh"
                ? `显示均线 (${maWindow}日)`
                : `Show MA (${maWindow}d)`}
            </span>
          </label>
        </div>
      </div>

      <div ref={containerRef} className="mt-4 w-full overflow-x-auto">
        <svg
          width={900}
          height={HEIGHT}
          role="img"
          aria-label={
            language === "zh"
              ? "fxUSD、Aave USDC 与 crvUSD(WBTC) 利率对比"
              : "fxUSD, Aave USDC, and crvUSD(WBTC) rate comparison"
          }
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerLeave}
          onTouchStart={handlePointerMove}
          onTouchMove={handlePointerMove}
        >
          <GridRows
            scale={yScale}
            width={900 - MARGIN.left - MARGIN.right}
            left={MARGIN.left}
            stroke={COLORS.grid}
            strokeDasharray="4 6"
          />

          <AxisLeft
            scale={yScale}
            left={MARGIN.left}
            tickFormat={(d) => formatPercent(Number(d))}
            stroke="rgba(226,232,240,0.6)"
            tickStroke="rgba(226,232,240,0.6)"
            tickLabelProps={() => ({
              fill: "#cbd5e1",
              fontSize: 11,
              textAnchor: "end",
              dx: -4,
            })}
          />

          <AxisBottom
            scale={xScale}
            top={HEIGHT - MARGIN.bottom}
            stroke="rgba(226,232,240,0.6)"
            tickStroke="rgba(226,232,240,0.6)"
            tickFormat={(d) => formatDate(d as Date, locale)}
            tickLabelProps={() => ({
              fill: "#cbd5e1",
              fontSize: 11,
              textAnchor: "middle",
              dy: "0.75em",
            })}
          />

          {showAave ? (
            <LinePath
              data={filtered.filter((p) => p.aave !== null)}
              x={(d) => xScale(d.date)}
              y={(d) => yScale(d.aave ?? 0)}
              stroke={COLORS.aave}
              strokeWidth={2}
              curve={undefined}
            />
          ) : null}

          {showCrv ? (
            <LinePath
              data={filtered.filter((p) => p.crv !== null)}
              x={(d) => xScale(d.date)}
              y={(d) => yScale(d.crv ?? 0)}
            stroke={COLORS.crv}
            strokeWidth={2}
            curve={undefined}
          />
        ) : null}
          {showFx ? (
            <LinePath
              data={filtered.filter((p) => p.fx !== null)}
              x={(d) => xScale(d.date)}
              y={(d) => yScale(d.fx ?? 0)}
              stroke={COLORS.fx}
              strokeWidth={2}
              curve={undefined}
            />
          ) : null}

          {showMa && showAave ? (
            <LinePath
              data={filtered.filter((p) => p.aaveMa !== undefined)}
              x={(d) => xScale(d.date)}
              y={(d) => yScale(d.aaveMa ?? 0)}
              stroke={COLORS.aaveMa}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          ) : null}

          {showMa && showCrv ? (
            <LinePath
              data={filtered.filter((p) => p.crvMa !== undefined)}
              x={(d) => xScale(d.date)}
              y={(d) => yScale(d.crvMa ?? 0)}
              stroke={COLORS.crvMa}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          ) : null}
          {showMa && showFx ? (
            <LinePath
              data={filtered.filter((p) => p.fxMa !== undefined)}
              x={(d) => xScale(d.date)}
              y={(d) => yScale(d.fxMa ?? 0)}
              stroke={COLORS.fxMa}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          ) : null}
        </svg>

        {tooltipData ? (
          <TooltipInPortal
            top={tooltipTop ?? 0}
            left={tooltipLeft ?? 0}
            className="rounded-xl border border-emerald-300/40 bg-slate-900/90 px-3 py-2 text-xs text-slate-100 shadow-lg"
          >
            <div className="font-semibold text-emerald-100">
              {formatDate(tooltipData.point.date, locale)}
            </div>
            <div className="mt-1 space-y-1">
              {showFx ? (
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLORS.fx }}
                  />
                  fxUSD: {formatPercent(tooltipData.point.fx)}
                </div>
              ) : null}
              {showAave ? (
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLORS.aave }}
                  />
                  Aave USDC: {formatPercent(tooltipData.point.aave)}
                </div>
              ) : null}
              {showCrv ? (
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLORS.crv }}
                  />
                  crvUSD(WBTC): {formatPercent(tooltipData.point.crv)}
                </div>
              ) : null}
              {showMa && showFx ? (
                <div className="flex items-center gap-2 text-slate-300">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLORS.fxMa }}
                  />
                  MA fxUSD:{" "}
                  {tooltipData.point.fxMa !== undefined
                    ? formatPercent(tooltipData.point.fxMa ?? null)
                    : "—"}
                </div>
              ) : null}
              {showMa && showAave ? (
                <div className="flex items-center gap-2 text-slate-300">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLORS.aaveMa }}
                  />
                  MA Aave:{" "}
                  {tooltipData.point.aaveMa !== undefined
                    ? formatPercent(tooltipData.point.aaveMa ?? null)
                    : "—"}
                </div>
              ) : null}
              {showMa && showCrv ? (
                <div className="flex items-center gap-2 text-slate-300">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLORS.crvMa }}
                  />
                  MA crvUSD:{" "}
                  {tooltipData.point.crvMa !== undefined
                    ? formatPercent(tooltipData.point.crvMa ?? null)
                    : "—"}
                </div>
              ) : null}
            </div>
          </TooltipInPortal>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-emerald-100/80">
        {lastUpdated ? (
          <span>
            {language === "zh" ? "数据时间" : "Last updated"}:{" "}
            <span className="text-emerald-100">
              {formatDate(new Date(lastUpdated), locale)}
            </span>
          </span>
        ) : null}
        <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1">
          {language === "zh"
            ? `数据源：${source === "fallback" ? "离线 CSV/JSON" : "DefiLlama/Curve API"}`
            : `Source: ${source === "fallback" ? "Offline CSV/JSON" : "DefiLlama/Curve API"}`}
        </span>
        <span className="rounded-full border border-slate-300/30 bg-slate-800/80 px-3 py-1 text-slate-200">
          {language === "zh"
            ? `移动均线：${maWindow} 天`
            : `Moving average: ${maWindow} days`}
        </span>
      </div>
    </div>
  );
}
