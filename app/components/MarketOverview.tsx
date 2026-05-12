"use client";

import Link from "next/link";
import { useState } from "react";

import { GlassCard } from "@/components/ui/GlassCard";
import type {
  FxActivityEntry,
  FxActivityPeriodSnapshot,
  FxActivitySnapshot,
  FxActivitySummary,
} from "@/lib/fxActivity";
import type { FxLeaderboardSnapshot } from "@/lib/fxLeaderboard";
import type { DashboardMetrics, Trader } from "@/lib/types";

type PeriodKey = FxActivityPeriodSnapshot["key"];

const PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: "daily", label: "24H" },
  { key: "weekly", label: "7D" },
  { key: "monthly", label: "30D" },
];

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "-";
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(2);
}

function formatTokenAmount(value: number) {
  if (!Number.isFinite(value)) return "-";
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (Math.abs(value) >= 100) return value.toFixed(1);
  if (Math.abs(value) >= 1) return value.toFixed(4);
  return value.toFixed(5);
}

function formatPercent(value: number, fractionDigits = 1) {
  if (!Number.isFinite(value)) return "-";
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

function getPnl(row: Trader) {
  return row.pnlClean ?? row.pnl ?? 0;
}

function shortenAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function getDebankProfileUrl(address: string) {
  return `https://debank.com/profile/${address}`;
}

function getPeriodSummary(
  snapshot: FxActivitySnapshot | null,
  token: string,
  periodKey: PeriodKey,
): FxActivitySummary | null {
  const tokenSnapshot = snapshot?.tokens.find((item) => item.token === token);
  return (
    tokenSnapshot?.periods.find((period) => period.key === periodKey)
      ?.current ?? null
  );
}

function LeaderRow({
  row,
  index,
  primary,
}: {
  row: Trader;
  index: number;
  primary: "volume" | "pnl";
}) {
  const pnl = getPnl(row);
  const volume = row.vol ?? 0;
  const roi = row.roi ?? 0;

  return (
    <tr className="border-t border-slate-800/80">
      <td className="w-12 px-4 py-4 font-mono text-xs text-slate-500">
        #{index + 1}
      </td>
      <td className="px-4 py-4">
        <a
          href={getDebankProfileUrl(row.trader)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-slate-200 underline decoration-slate-700 underline-offset-4 transition hover:text-neon-400"
        >
          {shortenAddress(row.trader)}
        </a>
      </td>
      <td className="px-4 py-4 text-right font-mono text-sm text-slate-100">
        {primary === "volume" ? formatCurrency(volume) : formatCurrency(pnl)}
      </td>
      <td className="px-4 py-4 text-right font-mono text-xs text-slate-500">
        {primary === "volume" ? formatCurrency(pnl) : formatCurrency(volume)}
      </td>
      <td className="px-4 py-4 text-right font-mono text-xs text-slate-500">
        {formatPercent(roi / 100, 1)}
      </td>
    </tr>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(value));
}

function ActivityRow({
  entry,
  index,
}: {
  entry: FxActivityEntry;
  index: number;
}) {
  const isLong =
    entry.metricId === "openLong" || entry.metricId === "closeLong";
  const direction = isLong ? "Long" : "Short";
  const directionClass = isLong ? "text-emerald-300" : "text-orange-300";

  return (
    <tr className="border-t border-slate-800/80">
      <td className="w-12 px-4 py-4 font-mono text-xs text-slate-500">
        #{index + 1}
      </td>
      <td className="px-4 py-4 font-mono text-xs text-slate-400">
        {formatDateTime(entry.timestamp)}
      </td>
      <td className="px-4 py-4 font-mono text-sm text-white">{entry.token}</td>
      <td className={`px-4 py-4 font-mono text-sm ${directionClass}`}>
        {direction}
      </td>
      <td className="px-4 py-4 text-right font-mono text-sm text-white">
        {formatTokenAmount(entry.volume)}
      </td>
      <td className="px-4 py-4 text-right font-mono text-xs text-slate-500">
        {entry.txHash ? (
          <a
            href={`https://etherscan.io/tx/${entry.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-300 underline decoration-sky-500/30 underline-offset-4 transition hover:text-sky-200"
          >
            {entry.txHash.slice(0, 8)}...{entry.txHash.slice(-6)}
          </a>
        ) : (
          "Not provided"
        )}
      </td>
    </tr>
  );
}

export function MarketOverview({
  metrics,
  activitySnapshot,
  recentLeaderboard,
}: {
  metrics: DashboardMetrics;
  activitySnapshot: FxActivitySnapshot | null;
  recentLeaderboard?: FxLeaderboardSnapshot | null;
}) {
  const [periodKey, setPeriodKey] = useState<PeriodKey>("daily");

  const topByVolume = (
    recentLeaderboard?.topByVolume ?? metrics.topByVolume
  ).slice(0, 3);
  const topByPnl = (recentLeaderboard?.topByPnl ?? metrics.topByPnl).slice(
    0,
    3,
  );
  const tokens = activitySnapshot?.tokens.slice(0, 2) ?? [];
  const largeOpenings =
    activitySnapshot?.activity
      .filter(
        (entry) =>
          entry.metricId === "openLong" || entry.metricId === "openShort",
      )
      .filter((entry) => {
        if (!activitySnapshot.lastTimestamp) return true;
        const latest = Date.parse(activitySnapshot.lastTimestamp);
        const time = Date.parse(entry.timestamp);
        return Number.isFinite(latest) && Number.isFinite(time)
          ? time > latest - 7 * 24 * 60 * 60 * 1000 && time <= latest
          : true;
      })
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, 5) ?? [];
  const largeClosings =
    activitySnapshot?.activity
      .filter(
        (entry) =>
          entry.metricId === "closeLong" || entry.metricId === "closeShort",
      )
      .filter((entry) => {
        if (!activitySnapshot.lastTimestamp) return true;
        const latest = Date.parse(activitySnapshot.lastTimestamp);
        const time = Date.parse(entry.timestamp);
        return Number.isFinite(latest) && Number.isFinite(time)
          ? time > latest - 7 * 24 * 60 * 60 * 1000 && time <= latest
          : true;
      })
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, 5) ?? [];

  return (
    <div className="min-h-screen text-slate-200">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 pt-8 pb-16">
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="label-subtle !text-neon-300">f(x) Protocol</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Smart Wallet Overview
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/docs"
              className="rounded-lg border border-slate-700/60 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
            >
              API Docs
            </Link>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          <GlassCard className="p-4">
            <div className="label-subtle">Tracked wallets</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-white">
              {metrics.totalTraders.toLocaleString()}
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="label-subtle">Total volume</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-neon-400">
              {formatCurrency(metrics.totalVol)}
            </div>
          </GlassCard>
        </section>

        <GlassCard className="overflow-hidden">
          <header className="flex flex-col gap-4 border-b border-slate-700/45 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-white">Overall Trend</h2>
            <div className="flex w-fit overflow-hidden rounded-lg border border-slate-700/70 bg-slate-950/60">
              {PERIODS.map((period) => (
                <button
                  key={period.key}
                  type="button"
                  onClick={() => setPeriodKey(period.key)}
                  className={`px-5 py-2 text-sm font-semibold transition ${
                    periodKey === period.key
                      ? "bg-sky-500/20 text-sky-100"
                      : "text-slate-500 hover:text-slate-200"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </header>

          <div className="grid gap-4 p-6 lg:grid-cols-2">
            {tokens.length > 0 ? (
              tokens.map((token) => {
                const summary = getPeriodSummary(
                  activitySnapshot,
                  token.token,
                  periodKey,
                );
                return (
                  <div
                    key={token.token}
                    className="rounded-lg border border-slate-700/55 bg-slate-950/35 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                        <span className="h-2.5 w-2.5 rounded-full bg-neon-500" />
                        {token.token}
                      </h3>
                      <div className="font-mono text-sm text-slate-500">
                        {PERIODS.find((period) => period.key === periodKey)
                          ?.label ?? "24H"}
                      </div>
                    </div>
                    <div className="mt-6 grid gap-3">
                      <div>
                        <div className="label-subtle">Total vol</div>
                        <div className="mt-1 font-mono text-2xl font-semibold text-white">
                          {summary
                            ? `${formatTokenAmount(summary.totalVolume)} ${token.token}`
                            : "-"}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
                          <div className="label-subtle !text-emerald-300">
                            Net long
                          </div>
                          <div
                            className={`mt-2 font-mono text-xl ${
                              (summary?.netLong ?? 0) >= 0
                                ? "text-emerald-300"
                                : "text-red-300"
                            }`}
                          >
                            {summary ? formatTokenAmount(summary.netLong) : "-"}
                          </div>
                        </div>
                        <div className="rounded-lg border border-sky-500/15 bg-sky-500/[0.04] p-4">
                          <div className="label-subtle !text-sky-300">
                            Net short
                          </div>
                          <div
                            className={`mt-2 font-mono text-xl ${
                              (summary?.netShort ?? 0) >= 0
                                ? "text-orange-300"
                                : "text-sky-300"
                            }`}
                          >
                            {summary
                              ? formatTokenAmount(summary.netShort)
                              : "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-slate-700/55 bg-slate-950/35 p-6 text-sm text-slate-500">
                No trend data available.
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="overflow-hidden">
          <header className="border-b border-slate-700/45 px-6 py-5">
            <h2 className="text-xl font-semibold text-white">
              Largest Opens & Closes · Last 7D
            </h2>
          </header>
          <div className="grid gap-6 p-6 xl:grid-cols-2">
            {[
              {
                title: "Largest opens",
                rows: largeOpenings,
                empty: "No recent opening data available.",
              },
              {
                title: "Largest closes",
                rows: largeClosings,
                empty: "No recent closing data available.",
              },
            ].map((section) => (
              <div
                key={section.title}
                className="overflow-hidden rounded-lg border border-slate-700/45 bg-slate-950/25"
              >
                <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-white">
                  {section.title}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="px-4 py-3 label-subtle">Rank</th>
                        <th className="px-4 py-3 label-subtle">Time</th>
                        <th className="px-4 py-3 label-subtle">Token</th>
                        <th className="px-4 py-3 label-subtle">Side</th>
                        <th className="px-4 py-3 text-right label-subtle">
                          Size
                        </th>
                        <th className="px-4 py-3 text-right label-subtle">
                          Tx
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.length > 0 ? (
                        section.rows.map((entry, index) => (
                          <ActivityRow
                            key={`${section.title}-${entry.timestamp}-${entry.token}-${entry.metricId}-${index}`}
                            entry={entry}
                            index={index}
                          />
                        ))
                      ) : (
                        <tr className="border-t border-slate-800/80">
                          <td
                            className="px-4 py-6 text-sm text-slate-500"
                            colSpan={6}
                          >
                            {section.empty}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <section className="grid gap-6 lg:grid-cols-2">
          <GlassCard className="overflow-hidden">
            <header className="border-b border-slate-700/45 px-6 py-5">
              <h2 className="text-xl font-semibold text-white">
                Top 3 Wallets by 7D Volume
              </h2>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-3 label-subtle">Rank</th>
                    <th className="px-4 py-3 label-subtle">Address</th>
                    <th className="px-4 py-3 text-right label-subtle">
                      Volume
                    </th>
                    <th className="px-4 py-3 text-right label-subtle">PNL</th>
                    <th className="px-4 py-3 text-right label-subtle">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {topByVolume.map((row, index) => (
                    <LeaderRow
                      key={row.trader}
                      row={row}
                      index={index}
                      primary="volume"
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard className="overflow-hidden">
            <header className="border-b border-slate-700/45 px-6 py-5">
              <h2 className="text-xl font-semibold text-white">
                Top 3 Wallets by 7D PNL
              </h2>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-3 label-subtle">Rank</th>
                    <th className="px-4 py-3 label-subtle">Address</th>
                    <th className="px-4 py-3 text-right label-subtle">PNL</th>
                    <th className="px-4 py-3 text-right label-subtle">
                      Volume
                    </th>
                    <th className="px-4 py-3 text-right label-subtle">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {topByPnl.map((row, index) => (
                    <LeaderRow
                      key={row.trader}
                      row={row}
                      index={index}
                      primary="pnl"
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </section>
      </div>
    </div>
  );
}
