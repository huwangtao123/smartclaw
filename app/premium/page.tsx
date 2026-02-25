import Link from "next/link";
import type { Metadata } from "next";

import { FxVolumeChart } from "@/app/components/FxVolumeChart";
import { loadFilteredTraders } from "@/lib/data";
import { type DailyVolumeRecord, fetchFxVolumeSnapshot } from "@/lib/fxVolume";
import { computeMetrics } from "@/lib/metrics";
import { updateDashboardData } from "@/lib/updateData";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowingStat } from "@/components/ui/GlowingStat";
import { NavbarWithState } from "@/components/ui/Navbar";
import { NeonProgress } from "@/components/ui/NeonProgress";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Premium Analytics — Smartclaw",
  description:
    "Top-10 traders by PNL and ROI on f(x) Protocol. Volume trends, win rates, and momentum indicators. $0.01 fxUSD per API call via x402.",
  alternates: {
    canonical: "/premium",
  },
};

function formatCurrency(value: number) {
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
  return value.toFixed(2);
}

function formatPercent(value: number, fractionDigits = 1) {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

function shortenAddress(value: string) {
  if (!value) return "—";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}
const premiumJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Smartclaw Premium Analytics",
  description:
    "Top-10 traders by PNL and ROI on f(x) Protocol. Volume trends, win rates, and momentum indicators.",
  offers: {
    "@type": "Offer",
    price: "0.01",
    priceCurrency: "USD",
    description: "Per API call via x402, pay $0.01 in fxUSD on Base network",
  },
  provider: {
    "@type": "Organization",
    name: "Smartclaw",
    url: "https://smartclaw.xyz",
  },
};

export default async function PremiumPage() {
  await updateDashboardData();
  const traders = await loadFilteredTraders();
  const metrics = computeMetrics(traders);
  let volumeSnapshot: Awaited<ReturnType<typeof fetchFxVolumeSnapshot>> | null =
    null;

  try {
    volumeSnapshot = await fetchFxVolumeSnapshot();
  } catch (error) {
    console.error("Failed to load FX volume snapshot", error);
  }

  const totalTopPnl = metrics.topByPnl.reduce(
    (acc, row) => acc + (row.pnlClean ?? row.pnl ?? 0),
    0,
  );
  const averageTopRoi =
    metrics.topByRoi.reduce((acc, row) => acc + (row.roi ?? 0), 0) /
    (metrics.topByRoi.length || 1);

  const preferredTokens = ["wstETH", "wBTC"];
  const volumeSnapshotLookup = new Map(
    volumeSnapshot?.tokens.map((series) => [series.token, series]) ?? [],
  );
  const daysToDisplay = 30;
  type VolumeSlice = { token: string; data: DailyVolumeRecord[] };
  const activeVolumeSeries: VolumeSlice[] = preferredTokens
    .map((token) => {
      const series = volumeSnapshotLookup.get(token);
      if (!series || series.data.length === 0) return null;
      const recent = series.data.slice(-daysToDisplay);
      return {
        token,
        data: recent,
      };
    })
    .filter((series): series is VolumeSlice => {
      if (!series) return false;
      return series.data.length > 0;
    });
  const lastVolumeTimestamp = volumeSnapshot?.lastTimestamp ?? null;

  const lastVolumeEntryLabel = lastVolumeTimestamp
    ? new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "UTC",
    }).format(new Date(lastVolumeTimestamp))
    : null;

  return (
    <div className="min-h-screen bg-black text-white/80 relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(premiumJsonLd) }}
      />
      {/* Background Glow */}
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-neon-500/[0.04] blur-[150px] rounded-full pointer-events-none" />

      <NavbarWithState />

      {/* Answer-first summary for crawlers and AI agents */}
      <section className="sr-only" aria-label="Premium Analytics Summary">
        <h1>Smartclaw Premium Analytics</h1>
        <p>
          Top-10 f(x) Protocol traders ranked by PNL and ROI. Access via GET /api/premium for $0.01 fxUSD per call using the x402 payment protocol on Base network.
          Currently tracking {metrics.totalTraders.toLocaleString()} wallets with {formatCurrency(metrics.totalVol)} in total volume.
        </p>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pt-14 pb-20 relative z-10">
        <GlassCard className="overflow-hidden !border-none bg-gradient-to-br from-void-800 to-neon-500/10 p-8 sm:p-12 animate-enter delay-100">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="label-subtle !text-neon-300">
                x402 Unlock · $0.01 fxUSD · Unlocks Top 10 PNL · ROI · Volume
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Premium Leaderboard Intelligence
              </h1>
              <p className="mt-4 text-sm text-slate-400 sm:text-base leading-relaxed">
                Your unlock delivers the complete top 10 PNL and ROI roster
                plus live transaction volume diagrams, letting you dissect
                capital deployment and directional conviction before the next
                rotation.
              </p>
            </div>
            <div className="grid w-full max-w-sm gap-6 p-6 bg-white/[0.03] border border-white/10 rounded-3xl">
              <div>
                <div className="label-subtle mb-2">Flow Share Captured</div>
                <div className="text-4xl font-mono text-white drop-shadow-[0_0_10px_rgba(0,255,157,0.3)]">
                  {formatPercent(metrics.weightedWinningRate, 1)}
                </div>
                <p className="mt-3 text-[10px] text-slate-500 uppercase tracking-wider">
                  Portion of tracked volume steered by winning wallets in this
                  cohort.
                </p>
                <div className="mt-4">
                  <NeonProgress value={metrics.weightedWinningRate * 100} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <GlowingStat
                  label="Top PNL Stack"
                  value={formatCurrency(totalTopPnl)}
                />
                <GlowingStat
                  label="Avg ROI"
                  value={formatPercent(averageTopRoi / 100, 1)}
                />
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 text-[10px] text-slate-500 uppercase tracking-widest sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <span className="text-neon-300 font-bold">Included:</span>
              <span>top 10 PNL and ROI intel</span>
              <span>transaction volume diagrams</span>
              <span>trade capture momentum</span>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              Back to Dashboard
            </Link>
          </div>
        </GlassCard>

        {activeVolumeSeries.length > 0 ? (
          <GlassCard className="p-8 sm:p-12 animate-enter delay-200">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  FX Protocol Transaction Volume
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Last 30 days · Data refreshes every 6 hours.
                </p>
              </div>
              {lastVolumeEntryLabel ? (
                <div className="label-subtle">
                  Last data entry: {lastVolumeEntryLabel}
                </div>
              ) : null}
            </header>
            <div className="mt-8 grid gap-10">
              {activeVolumeSeries.map(({ token, data }) => (
                <div
                  key={token}
                  className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl"
                >
                  <FxVolumeChart
                    token={token}
                    data={data}
                    subtitle="Last 30 Days · UTC"
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        ) : null}

        <section className="grid gap-8 lg:grid-cols-2">
          <GlassCard className="p-6 animate-enter delay-300">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="label-subtle !text-neon-300">
                  Top 10 PNL Wallets
                </h2>
                <p className="mt-1 text-[10px] text-slate-500 uppercase tracking-tight">
                  Sorted by clean PNL.
                </p>
              </div>
              <div className="text-right">
                <GlowingStat
                  label="Total PNL"
                  value={formatCurrency(totalTopPnl)}
                  className="items-end"
                />
              </div>
            </header>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02]">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.05]">
                    <th className="px-4 py-3 text-left label-subtle !text-slate-400">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left label-subtle !text-slate-400">
                      Wallet
                    </th>
                    <th className="px-4 py-3 text-right label-subtle !text-slate-400">
                      PNL
                    </th>
                    <th className="px-4 py-3 text-right label-subtle !text-slate-400">
                      Volume
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {metrics.topByPnl.map((row) => (
                    <tr
                      key={row.trader}
                      className="transition hover:bg-white/[0.02] group"
                    >
                      <td className="px-4 py-4 font-mono text-slate-600 group-hover:text-neon-300 transition-colors">
                        #{row.rank}
                      </td>
                      <td className="px-4 py-4 font-mono text-slate-300">
                        <Link
                          href={`https://debank.com/profile/${row.trader}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-white/10 underline-offset-4 hover:text-white transition"
                        >
                          {shortenAddress(row.trader)}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-white">
                        {formatCurrency(row.pnlClean ?? row.pnl ?? 0)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-slate-400">
                        {formatCurrency(row.vol ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard className="p-6 animate-enter delay-[400ms]">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="label-subtle !text-neon-300">
                  Top 10 ROI Wallets
                </h2>
                <p className="mt-1 text-[10px] text-slate-500 uppercase tracking-tight">
                  Ranked by highest outperformance.
                </p>
              </div>
              <div className="text-right">
                <GlowingStat
                  label="Avg ROI"
                  value={formatPercent(averageTopRoi / 100, 1)}
                  className="items-end"
                />
              </div>
            </header>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02]">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.05]">
                    <th className="px-4 py-3 text-left label-subtle !text-slate-400">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left label-subtle !text-slate-400">
                      Wallet
                    </th>
                    <th className="px-4 py-3 text-right label-subtle !text-slate-400">
                      ROI
                    </th>
                    <th className="px-4 py-3 text-right label-subtle !text-slate-400">
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {metrics.topByRoi.map((row) => (
                    <tr
                      key={row.trader}
                      className="transition hover:bg-white/[0.02] group"
                    >
                      <td className="px-4 py-4 font-mono text-slate-600 group-hover:text-neon-300 transition-colors">
                        #{row.rank}
                      </td>
                      <td className="px-4 py-4 font-mono text-slate-300">
                        <Link
                          href={`https://debank.com/profile/${row.trader}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-white/10 underline-offset-4 hover:text-white transition"
                        >
                          {shortenAddress(row.trader)}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-white">
                        {formatPercent((row.roi ?? 0) / 100, 1)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-slate-400">
                        {formatCurrency(row.net ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </section>

        <GlassCard className="p-8 animate-enter delay-500">
          <h2 className="label-subtle !text-neon-300">
            Premium Signal Artifacts
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-neon-500/20 transition">
              <h3 className="label-subtle !text-neon-300">Flow Magnet</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Winning wallets control{" "}
                {formatPercent(metrics.weightedWinningRate, 1)} of tracked flow,
                and the premium list shows exactly where that capital
                consolidates.
              </p>
            </article>
            <article className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-neon-500/20 transition">
              <h3 className="label-subtle !text-neon-300">Conviction</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Average ROI across the top performers is{" "}
                {formatPercent(averageTopRoi / 100, 1)}, underscoring the
                momentum behind directional trades.
              </p>
            </article>
            <article className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-neon-500/20 transition">
              <h3 className="label-subtle !text-neon-300">Execution Bias</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Combine PNL and ROI cohorts to pinpoint wallets that pair
                conviction with efficient execution. These addresses often lead
                the next rotation.
              </p>
            </article>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
