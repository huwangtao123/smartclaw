"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import type {
  FxActivityPeriodSnapshot,
  FxActivitySnapshot,
} from "@/lib/fxActivity";

/* ─── Helpers ─── */

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(4);
}

function formatChangePercent(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function formatActivityTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

function formatLastUpdated(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

const ACTION_STYLE: Record<
  string,
  { pill: string; dot: string; label: string }
> = {
  openLong: {
    pill: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
    label: "Open Long",
  },
  closeLong: {
    pill: "border-red-400/25 bg-red-500/10 text-red-300",
    dot: "bg-red-400",
    label: "Close Long",
  },
  openShort: {
    pill: "border-orange-400/25 bg-orange-500/10 text-orange-300",
    dot: "bg-orange-400",
    label: "Open Short",
  },
  closeShort: {
    pill: "border-sky-400/25 bg-sky-500/10 text-sky-300",
    dot: "bg-sky-400",
    label: "Close Short",
  },
};

/* ─── Summary stat tile ─── */
const SUMMARY_TILE_CONFIG = [
  {
    id: "openLong" as const,
    label: "Open Long",
    accent: "#22c55e",
    bg: "bg-emerald-500/[0.05]",
    border: "border-emerald-500/20",
    text: "text-emerald-300",
    sub: "text-emerald-400/50",
  },
  {
    id: "closeLong" as const,
    label: "Close Long",
    accent: "#f87171",
    bg: "bg-red-500/[0.05]",
    border: "border-red-500/20",
    text: "text-red-300",
    sub: "text-red-400/50",
  },
  {
    id: "openShort" as const,
    label: "Open Short",
    accent: "#fb923c",
    bg: "bg-orange-500/[0.05]",
    border: "border-orange-500/20",
    text: "text-orange-300",
    sub: "text-orange-400/50",
  },
  {
    id: "closeShort" as const,
    label: "Close Short",
    accent: "#38bdf8",
    bg: "bg-sky-500/[0.05]",
    border: "border-sky-500/20",
    text: "text-sky-300",
    sub: "text-sky-400/50",
  },
];

const LOW_BASE_THRESHOLD = 0.01;

function DeltaBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const absPrev = Math.abs(previous);
  const absCurr = Math.abs(current);

  if (absPrev < LOW_BASE_THRESHOLD) {
    if (absCurr < LOW_BASE_THRESHOLD) return null;
    if (absCurr < LOW_BASE_THRESHOLD * 10) {
      return (
        <span className="text-[10px] font-mono text-slate-400 bg-slate-500/10 px-1.5 py-0.5 rounded">
          low base
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
        new activity
      </span>
    );
  }

  const delta = formatChangePercent(current, previous);
  if (delta === null) return null;
  const isPositive = delta > 0;
  if (delta === 0)
    return <span className="text-slate-500 text-[10px]">0%</span>;

  return (
    <span
      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
        isPositive
          ? "text-emerald-400 bg-emerald-500/10"
          : "text-red-400 bg-red-500/10"
      }`}
    >
      {isPositive ? "+" : ""}
      {delta.toFixed(1)}%
    </span>
  );
}

/* ─── Action Pill ─── */
function ActionPill({ metricId }: { metricId: string }) {
  const style = ACTION_STYLE[metricId] ?? {
    pill: "border-slate-400/20 bg-slate-500/10 text-slate-300",
    dot: "bg-slate-400",
    label: metricId,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
      {style.label}
    </span>
  );
}

/* ─── Period row inside token card ─── */
function TokenPeriodRow({
  data,
  token,
}: {
  data: FxActivityPeriodSnapshot;
  token: string;
}) {
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 uppercase">Total Vol</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-white">
            {formatCurrency(data.current.totalVolume)}{" "}
            <span className="text-slate-500">{token}</span>
          </span>
          <DeltaBadge
            current={data.current.totalVolume}
            previous={data.previous.totalVolume}
          />
        </div>
      </div>

      {/* Net Long / Net Short */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] p-3">
          <div className="mb-1.5 text-[10px] uppercase text-emerald-400/50">
            Net Long
          </div>
          <div className="flex items-end justify-between gap-1">
            <span
              className={`font-mono text-sm ${
                data.current.netLong >= 0 ? "text-emerald-300" : "text-red-400"
              }`}
            >
              {data.current.netLong > 0 ? "+" : ""}
              {formatCurrency(data.current.netLong)}
            </span>
            <DeltaBadge
              current={data.current.netLong}
              previous={data.previous.netLong}
            />
          </div>
        </div>

        <div className="rounded-lg border border-sky-500/10 bg-sky-500/[0.03] p-3">
          <div className="mb-1.5 text-[10px] uppercase text-sky-400/50">
            Net Short
          </div>
          <div className="flex items-end justify-between gap-1">
            <span
              className={`font-mono text-sm ${
                data.current.netShort >= 0 ? "text-orange-300" : "text-sky-400"
              }`}
            >
              {data.current.netShort > 0 ? "+" : ""}
              {formatCurrency(data.current.netShort)}
            </span>
            <DeltaBadge
              current={data.current.netShort}
              previous={data.previous.netShort}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Token Flow Card (with period tabs) ─── */
function TokenFlowCard({
  token,
  totalVolume,
  periods,
}: {
  token: string;
  totalVolume: number;
  periods: FxActivityPeriodSnapshot[];
}) {
  const [activePeriod, setActivePeriod] = useState(0);
  const current = periods[activePeriod];

  return (
    <div className="rounded-lg border border-slate-700/55 bg-slate-950/35 p-5 transition-colors duration-200 hover:border-slate-500/60">
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <span className="h-2 w-2 rounded-full bg-neon-500" />
          {token} Flow
        </h3>
        {/* Period tabs */}
        <div className="flex items-center rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {periods.map((p, i) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setActivePeriod(i)}
              className={`cursor-pointer px-3 py-1.5 text-[10px] font-bold uppercase transition-colors ${
                activePeriod === i
                  ? "bg-sky-400/10 text-sky-200"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <TokenPeriodRow data={current} token={token} />

      {/* Breakdown bar */}
      <div className="mt-4 text-[10px] uppercase text-slate-600">
        All-time vol:{" "}
        <span className="text-slate-400 font-mono">
          {formatCurrency(totalVolume)} {token}
        </span>
      </div>
    </div>
  );
}

/* ─── Main export ─── */
type FxActivitySectionProps = {
  snapshot: FxActivitySnapshot | null;
  title?: string;
  subtitle?: string;
  className?: string;
  isZh?: boolean;
  showActivityTable?: boolean;
  surface?: "card" | "plain";
  compact?: boolean;
};

export function FxActivitySection({
  snapshot,
  title,
  subtitle,
  className = "",
  isZh = false,
  showActivityTable = true,
  surface = "card",
  compact = false,
}: FxActivitySectionProps) {
  if (!snapshot) return null;

  const defaultTitle = isZh ? "FX 资金流向" : "FX Capital Flow";
  const defaultSubtitle = isZh
    ? "聚合开仓与平仓资金流，当前与上周期对比"
    : "Aggregate open/close capital flow · current vs previous period";

  const resolvedTitle = title ?? defaultTitle;
  const resolvedSubtitle = subtitle ?? defaultSubtitle;

  const lastUpdatedLabel = snapshot.lastTimestamp
    ? formatLastUpdated(snapshot.lastTimestamp)
    : null;

  // Compute aggregate 24H summary across all tokens (using first period = daily)
  const allTokens = snapshot.tokens;
  const summaryTotals = {
    openLong: 0,
    closeLong: 0,
    openShort: 0,
    closeShort: 0,
  };
  for (const t of allTokens) {
    const daily = t.periods[0]; // 24H
    summaryTotals.openLong += daily.current.openLong;
    summaryTotals.closeLong += daily.current.closeLong;
    summaryTotals.openShort += daily.current.openShort;
    summaryTotals.closeShort += daily.current.closeShort;
  }

  const prevTotals = { openLong: 0, closeLong: 0, openShort: 0, closeShort: 0 };
  for (const t of allTokens) {
    const daily = t.periods[0];
    prevTotals.openLong += daily.previous.openLong;
    prevTotals.closeLong += daily.previous.closeLong;
    prevTotals.openShort += daily.previous.openShort;
    prevTotals.closeShort += daily.previous.closeShort;
  }

  const Wrapper = surface === "card" ? GlassCard : "div";

  return (
    <Wrapper className={`overflow-hidden ${className}`}>
      {/* ── Section header ── */}
      <div className="border-b border-slate-700/45 px-6 pt-6 pb-5 sm:px-8 sm:pt-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
                {resolvedTitle}
              </h2>
              <span className="flex items-center gap-1.5 rounded-md border border-neon-500/25 bg-neon-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-neon-500">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-500" />
                Live
              </span>
            </div>
            {resolvedSubtitle ? (
              <p className="text-sm text-slate-400">{resolvedSubtitle}</p>
            ) : null}
            {!compact ? (
              <p className="mt-1.5 border-l-2 border-sky-400/25 pl-3 text-[11px] text-slate-500">
                {isZh
                  ? "原生代币金额不跨资产求和。百分比对比相同时长的前一周期。极小的前期值显示为标签。"
                  : "Native token amounts are not summed across assets. Percentages compare equal-length periods. Tiny prior values show as badges."}
              </p>
            ) : null}
          </div>

          <div className="shrink-0 text-right">
            {lastUpdatedLabel && (
              <div className="label-subtle !text-slate-500 text-right">
                {isZh ? "最新数据" : "Last entry"}
                <br />
                <span className="font-mono text-[11px] text-slate-400 normal-case tracking-normal">
                  {lastUpdatedLabel}
                </span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-end gap-4 text-[10px] uppercase text-slate-600">
              <span>{snapshot.overview.tokenCount} tokens</span>
              <span className="text-slate-700">·</span>
              <span>{snapshot.activity.length.toLocaleString()} rows</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 summary stat tiles (24H aggregate across all tokens) ── */}
      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:px-8 lg:grid-cols-4">
        {SUMMARY_TILE_CONFIG.map((cfg) => (
          <div
            key={cfg.id}
            className={`rounded-lg border p-4 ${cfg.bg} ${cfg.border}`}
          >
            <div className={`mb-2 text-[10px] uppercase ${cfg.sub}`}>
              {isZh
                ? cfg.id === "openLong"
                  ? "开多"
                  : cfg.id === "closeLong"
                    ? "平多"
                    : cfg.id === "openShort"
                      ? "开空"
                      : "平空"
                : cfg.label}
            </div>
            <div className={`font-mono text-lg font-bold ${cfg.text}`}>
              {formatCurrency(summaryTotals[cfg.id])}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <DeltaBadge
                current={summaryTotals[cfg.id]}
                previous={prevTotals[cfg.id]}
              />
              <span className="text-[10px] text-slate-600 uppercase">24H</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Token flow cards ── */}
      <div className="mt-5 grid gap-4 px-6 sm:px-8 lg:grid-cols-2">
        {allTokens.map((t) => (
          <TokenFlowCard
            key={t.token}
            token={t.token}
            totalVolume={t.totalVolume}
            periods={t.periods}
          />
        ))}
      </div>

      {showActivityTable ? (
        <div className="mx-6 mt-6 mb-6 overflow-hidden rounded-lg border border-slate-700/50 bg-slate-950/25 sm:mx-8 sm:mb-8">
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.05] px-5 py-4">
            <div>
              <h3 className="label-subtle !text-neon-500">
                {isZh ? "全量行动记录" : "All Feed Actions"}
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                {isZh
                  ? "FX 活动 Feed 中所有的开仓 / 平仓聚合行数。"
                  : "Every open/close aggregate row from the FX activity feed."}
              </p>
            </div>
            <div className="shrink-0 text-[10px] uppercase text-slate-600">
              {snapshot.activity.length.toLocaleString()} rows
            </div>
          </div>

          <div className="max-h-[36rem] overflow-auto">
            <table className="min-w-full text-xs">
              <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
                <tr className="border-b border-white/[0.05]">
                  <th className="px-5 py-3 text-left label-subtle !text-slate-500">
                    {isZh ? "时间 (UTC)" : "Timestamp (UTC)"}
                  </th>
                  <th className="px-5 py-3 text-left label-subtle !text-slate-500">
                    {isZh ? "代币" : "Token"}
                  </th>
                  <th className="px-5 py-3 text-left label-subtle !text-slate-500">
                    {isZh ? "操作" : "Action"}
                  </th>
                  <th className="hidden px-5 py-3 text-left label-subtle !text-slate-500 lg:table-cell">
                    {isZh ? "来源方法" : "Source Method"}
                  </th>
                  <th className="px-5 py-3 text-right label-subtle !text-slate-500">
                    {isZh ? "成交量" : "Volume"}
                  </th>
                  <th className="hidden px-5 py-3 text-right label-subtle !text-slate-500 sm:table-cell">
                    {isZh ? "窗口" : "Window"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {snapshot.activity.map((entry) => (
                  <tr
                    key={`${entry.timestamp}-${entry.token}-${entry.metricId}-${entry.metricName ?? "metric"}`}
                    className="transition-colors hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-3 font-mono text-slate-500">
                      {formatActivityTimestamp(entry.timestamp)}
                    </td>
                    <td className="px-5 py-3 font-mono font-semibold text-white">
                      {entry.token}
                    </td>
                    <td className="px-5 py-3">
                      <ActionPill metricId={entry.metricId} />
                    </td>
                    <td className="hidden px-5 py-3 lg:table-cell">
                      <span className="font-mono text-[11px] text-slate-600">
                        {entry.metricName ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">
                      {formatCurrency(entry.volume)}{" "}
                      <span className="text-slate-500">{entry.token}</span>
                    </td>
                    <td className="hidden px-5 py-3 text-right font-mono text-slate-500 sm:table-cell">
                      {entry.periodHours ? `${entry.periodHours}h` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </Wrapper>
  );
}
