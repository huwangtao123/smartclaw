import Link from "next/link";

import { loadFilteredTraders } from "@/lib/data";
import { computeMetrics } from "@/lib/metrics";
import { updateDashboardData } from "@/lib/updateData";

export const dynamic = "force-dynamic";

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

export default async function PremiumPage() {
  await updateDashboardData();
  const traders = await loadFilteredTraders();
  const metrics = computeMetrics(traders);
  const totalTopPnl = metrics.topByPnl.reduce(
    (acc, row) => acc + (row.pnlClean ?? row.pnl ?? 0),
    0,
  );
  const averageTopRoi =
    metrics.topByRoi.reduce((acc, row) => acc + (row.roi ?? 0), 0) /
    (metrics.topByRoi.length || 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-14">
        <header className="overflow-hidden rounded-4xl border border-emerald-400/30 bg-gradient-to-br from-emerald-600/40 via-slate-900/70 to-slate-950/90 p-8 shadow-[0_0_120px_-40px_rgba(16,185,129,0.6)] sm:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100/90">
                x402 Unlock · $1 USDC
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-emerald-50 sm:text-5xl">
                Premium Leaderboard Intelligence
              </h1>
              <p className="mt-4 text-sm text-emerald-50/80 sm:text-base">
                You just unlocked the full depth of the f(x) leaderboard.
                Explore the complete top 10 PNL and ROI wallets, dissect their
                capital deployment, and overlay conviction metrics to predict
                the next rotation.
              </p>
            </div>
            <div className="grid w-full max-w-sm gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-emerald-50">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-emerald-200/80">
                  Flow Share Captured
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {formatPercent(metrics.weightedWinningRate, 1)}
                </p>
                <p className="mt-1 text-xs text-emerald-100/70">
                  Portion of tracked volume steered by winning wallets in this
                  cohort.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3">
                  <p className="uppercase tracking-[0.28em] text-emerald-200/80">
                    Top PNL Stack
                  </p>
                  <p className="mt-2 text-lg font-semibold text-emerald-50">
                    {formatCurrency(totalTopPnl)}
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-300/20 bg-sky-500/10 p-3">
                  <p className="uppercase tracking-[0.28em] text-sky-200/80">
                    Avg ROI
                  </p>
                  <p className="mt-2 text-lg font-semibold text-sky-50">
                    {formatPercent(averageTopRoi / 100, 1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-4 text-xs text-emerald-100/70 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-semibold text-emerald-200">Included:</span>{" "}
              full top 10 by PNL and ROI, trade volume + net capture, momentum
              overlays, DeBank deep links.
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-emerald-300/70 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:border-emerald-200 hover:text-emerald-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 via-slate-900/60 to-slate-950/80 p-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-200/80">
                  Top 10 PNL Wallets
                </h2>
                <p className="mt-1 text-xs text-emerald-100/80">
                  Sorted by clean PNL. Net values include adjustments for wash
                  trading noise.
                </p>
              </div>
              <div className="text-right text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">
                Total: {formatCurrency(totalTopPnl)}
              </div>
            </header>
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50">
              <table className="min-w-full divide-y divide-emerald-900/40 text-xs sm:text-sm">
                <thead className="bg-emerald-500/10 text-emerald-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.3em]">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.3em]">
                      Wallet
                    </th>
                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-[0.3em]">
                      PNL
                    </th>
                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-[0.3em]">
                      Volume
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/30">
                  {metrics.topByPnl.map((row) => (
                    <tr key={row.trader} className="hover:bg-emerald-500/5">
                      <td className="px-4 py-3 font-mono text-emerald-100/80">
                        #{row.rank}
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-100">
                        <Link
                          href={`https://debank.com/profile/${row.trader}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-emerald-200/50 underline-offset-4 hover:text-emerald-50"
                        >
                          {shortenAddress(row.trader)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-100">
                        {formatCurrency(row.pnlClean ?? row.pnl ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-100">
                        {formatCurrency(row.vol ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-sky-400/30 bg-gradient-to-br from-sky-500/20 via-slate-900/60 to-slate-950/80 p-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-200/80">
                  Top 10 ROI Wallets
                </h2>
                <p className="mt-1 text-xs text-sky-100/80">
                  ROI values expressed as percentage returns, ranked by highest
                  outperformance.
                </p>
              </div>
              <div className="text-right text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80">
                Avg ROI: {formatPercent(averageTopRoi / 100, 1)}
              </div>
            </header>
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50">
              <table className="min-w-full divide-y divide-sky-900/40 text-xs sm:text-sm">
                <thead className="bg-sky-500/10 text-sky-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.3em]">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.3em]">
                      Wallet
                    </th>
                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-[0.3em]">
                      ROI
                    </th>
                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-[0.3em]">
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-900/30">
                  {metrics.topByRoi.map((row) => (
                    <tr key={row.trader} className="hover:bg-sky-500/5">
                      <td className="px-4 py-3 font-mono text-sky-100/80">
                        #{row.rank}
                      </td>
                      <td className="px-4 py-3 font-mono text-sky-100">
                        <Link
                          href={`https://debank.com/profile/${row.trader}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-sky-200/50 underline-offset-4 hover:text-sky-50"
                        >
                          {shortenAddress(row.trader)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-sky-100">
                        {formatPercent((row.roi ?? 0) / 100, 1)}
                      </td>
                      <td className="px-4 py-3 text-right text-sky-100">
                        {formatCurrency(row.net ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-200/80">
            Premium Signals
          </h2>
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
              <h3 className="text-xs uppercase tracking-[0.28em] text-emerald-200">
                Flow Magnet
              </h3>
              <p className="mt-2 text-sm text-slate-200">
                Winning wallets control{" "}
                {formatPercent(metrics.weightedWinningRate, 1)} of tracked flow,
                and the premium list shows exactly where that capital
                consolidates.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
              <h3 className="text-xs uppercase tracking-[0.28em] text-sky-200">
                Conviction
              </h3>
              <p className="mt-2 text-sm text-slate-200">
                Average ROI across the top performers is{" "}
                {formatPercent(averageTopRoi / 100, 1)}, underscoring the
                momentum behind directional trades.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
              <h3 className="text-xs uppercase tracking-[0.28em] text-amber-200">
                Execution Bias
              </h3>
              <p className="mt-2 text-sm text-slate-200">
                Combine PNL and ROI cohorts to pinpoint wallets that pair
                conviction with efficient execution. These addresses often lead
                the next rotation.
              </p>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
