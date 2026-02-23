"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { DashboardMetrics, Trader } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowingStat } from "@/components/ui/GlowingStat";
import { NeonProgress } from "@/components/ui/NeonProgress";

type Language = "en" | "zh";

function formatPercent(value: number, fractionDigits = 1) {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

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

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString();
}

const LANGUAGE_ORDER: Language[] = ["en", "zh"];

function getPnl(row: Trader) {
  return row.pnlClean ?? row.pnl ?? 0;
}

function getDebankProfileUrl(address: string) {
  return `https://debank.com/profile/${address}`;
}

function LanguageToggle({
  language,
  onChange,
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <div className="flex justify-end">
      <div className="inline-flex rounded-full border border-slate-700 bg-slate-900/70 p-1 text-xs font-medium text-slate-300">
        {LANGUAGE_ORDER.map((code) => {
          const isActive = language === code;
          const label = code === "en" ? "EN" : "中文";
          return (
            <button
              key={code}
              type="button"
              onClick={() => onChange(code)}
              className={`rounded-full px-3 py-1 transition ${isActive
                ? "bg-emerald-400 text-slate-900"
                : "hover:bg-slate-800/80 hover:text-slate-100"
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard({ metrics }: { metrics: DashboardMetrics }) {
  const [language, setLanguage] = useState<Language>("en");
  const isZh = language === "zh";

  const {
    totalTraders,
    winningCount,
    losingCount,
    winningRate,
    weightedWinningRate,
    winningVol,
    totalVol,
    winningNet,
    totalNet,
    netMomentumShare,
    totalPnl,
    avgRoi,
    topByPnl,
    topByRoi,
    hasMajorityMomentum,
  } = metrics;

  const progressWidth = Math.max(weightedWinningRate * 100, 0);
  const winRateWidth = Math.max(winningRate * 100, 0);

  const topPnlTotal = useMemo(
    () => topByPnl.reduce((acc: number, row: Trader) => acc + getPnl(row), 0),
    [topByPnl],
  );

  const topWinner = topByPnl[0];
  const topRoiLeader = topByRoi[0];

  const headline = isZh
    ? "f(x) 协议盈利脉搏"
    : "f(x) Protocol Leaderboard Pulse";
  const strapline = isZh
    ? "最新榜单显示，盈利钱包掌握着更高的成交量。只要胜率保持高位，就顺势而为。"
    : "The latest leaderboard snapshot shows that profitable wallets now control a larger share of traded volume. Lean into the momentum while the market's winning conviction stays elevated.";

  if (!totalTraders) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
          <LanguageToggle language={language} onChange={setLanguage} />
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <h1 className="text-2xl font-semibold text-slate-50">
              {isZh ? "没有可展示的数据" : "No data available"}
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              {isZh
                ? "请先更新 fx_leaderboard_all.json，然后刷新页面。"
                : "Update fx_leaderboard_all.json and reload the page to see the dashboard."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-900 text-slate-100 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-neon-500/10 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 relative z-10">
        <div className="animate-enter delay-100">
          <LanguageToggle language={language} onChange={setLanguage} />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-300">
          <Link
            href="/"
            className="rounded-full border border-slate-700 px-3 py-1 hover:border-emerald-300/60 hover:text-emerald-200"
          >
            {isZh ? "主页" : "Home"}
          </Link>
          <Link
            href="/fxmint"
            className="rounded-full border border-emerald-400/30 px-3 py-1 text-emerald-200 hover:border-emerald-300 hover:text-emerald-100"
          >
            FXMint
          </Link>
        </div>

        <header className="flex flex-col gap-3 animate-enter delay-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="relative h-14 w-14 shrink-0 transition-transform hover:scale-110 duration-500">
              <Image
                src="/fx-protocol-icon.svg"
                alt="f(x) Protocol logo"
                fill
                sizes="56px"
                priority
              />
            </div>
            <div>
              <div className="label-subtle !text-neon-300/80">
                {isZh ? "盈利趋势总览" : "Profit Momentum Overview"}
              </div>
              <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl tracking-tight">
                {headline}
              </h1>
            </div>
          </div>
          <p className="max-w-3xl text-sm text-slate-400 sm:text-base leading-relaxed">
            {strapline}
          </p>
        </header>

        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-sm text-emerald-50 sm:flex sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            {isZh ? (
              <>
                支付{" "}
                <span className="font-semibold text-emerald-200">$0.01 USDC</span>
                （通过 x402 支付流） 解锁完整的 PNL 与 ROI
                前十名钱包、净额与动能脉冲。
              </>
            ) : (
              <>
                Unlock the full Top 10 PNL and ROI cohorts, complete with net
                flow context, for{" "}
                <span className="font-semibold text-emerald-200">$0.01 USDC</span>{" "}
                using the x402 payment flow.
              </>
            )}
          </div>
          <Link
            href="/premium"
            className="mt-3 inline-flex items-center justify-center rounded-full bg-emerald-400/90 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 transition hover:bg-emerald-300 sm:mt-0"
          >
            {isZh ? "立即解锁" : "Unlock Now"}
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <GlassCard className="p-8 animate-enter delay-300 border-neon-500/20 bg-neon-500/5">
            <span className="label-subtle !text-neon-300/80">
              {isZh ? "按成交量加权的胜率" : "Volume-weighted winning rate"}
            </span>
            <div className="mt-4 flex items-end gap-4">
              <span className="text-5xl font-mono text-white drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">
                {formatPercent(weightedWinningRate, 1)}
              </span>
              <span className="text-sm text-slate-400 mb-2">
                {isZh
                  ? "全部成交量中由盈利钱包贡献的占比"
                  : "of total volume is generated by winning traders"}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              {isZh ? (
                hasMajorityMomentum ? (
                  <>
                    尽管只有 {formatPercent(winningRate, 1)} 的账户处于盈利，
                    它们的成交量已经占据主导，胜率明显压过亏损方。
                  </>
                ) : (
                  <>
                    尽管只有 {formatPercent(winningRate, 1)} 的账户处于盈利，
                    但它们的成交量正在迅速逼近亏损方，胜率持续走高。
                  </>
                )
              ) : hasMajorityMomentum ? (
                <>
                  Even though only {formatPercent(winningRate, 1)} of accounts
                  are net positive, their flow now drives the majority of market
                  liquidity—a clear signal that the winning rate is pulling
                  ahead of the losing side.
                </>
              ) : (
                <>
                  Even though only {formatPercent(winningRate, 1)} of accounts
                  are net positive, their flow is rapidly closing the gap with
                  losing volume, signalling a higher winning trend.
                </>
              )}
            </p>
            <div className="mt-6">
              <NeonProgress value={progressWidth} />
            </div>
            <dl className="mt-8 grid grid-cols-2 gap-4">
              <GlowingStat
                label={isZh ? "盈利成交量" : "Winning volume"}
                value={formatCurrency(winningVol)}
              />
              <GlowingStat
                label={isZh ? "总成交量" : "Total volume"}
                value={formatCurrency(totalVol)}
              />
            </dl>
          </GlassCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard className="p-6 animate-enter delay-100">
              <div className="label-subtle">
                {isZh ? "账户结构" : "Trader mix"}
              </div>
              <div className="mt-4 text-3xl font-mono text-white">
                {formatNumber(winningCount)} {isZh ? "个盈利账户" : "winners"}
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {isZh
                  ? `在跟踪的 ${formatNumber(totalTraders)} 个地址中，有 ${formatPercent(
                    winningRate,
                    1,
                  )} 录得盈利。`
                  : `${formatPercent(winningRate, 1)} of ${formatNumber(
                    totalTraders,
                  )} tracked wallets closed the period in profit.`}
              </p>
              <div className="mt-5">
                <NeonProgress value={winRateWidth} />
              </div>
              <dl className="mt-6 flex justify-between">
                <GlowingStat
                  label={isZh ? "盈利" : "Winners"}
                  value={formatNumber(winningCount)}
                />
                <GlowingStat
                  label={isZh ? "亏损" : "Losers"}
                  value={formatNumber(losingCount)}
                  className="text-right items-end"
                />
              </dl>
            </GlassCard>

            <GlassCard className="p-6 animate-enter delay-200">
              <div className="label-subtle">
                {isZh ? "动能占比" : "Momentum share"}
              </div>
              <div className="mt-4 text-3xl font-mono text-white">
                {formatPercent(netMomentumShare, 1)}
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {isZh
                  ? "盈利资金捕获的累计净额占比。即便考虑资金进出，正向流动仍然占据上风。"
                  : "Share of cumulative net capital captured by profit-making traders. Positive flow dominates even when accounting for net cash movements."}
              </p>
              <dl className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="label-subtle">
                    {isZh ? "盈利净额" : "Winning net"}
                  </span>
                  <span className="font-mono text-slate-200">
                    {formatCurrency(winningNet)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="label-subtle">
                    {isZh ? "整体净额" : "Total net"}
                  </span>
                  <span className="font-mono text-slate-200">
                    {formatCurrency(totalNet)}
                  </span>
                </div>
              </dl>
            </GlassCard>

            <GlassCard className="p-6 animate-enter delay-300">
              <GlowingStat
                label={isZh ? "累计盈亏" : "Aggregate pnl"}
                value={formatCurrency(totalPnl)}
              />
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                {isZh
                  ? "当前榜单下的总盈利。头部地址集中获利，使整体情绪被显著推高。"
                  : "Gross profit generated across the entire leaderboard snapshot. Concentrated among the best performers, lifting the overall tone."}
              </p>
            </GlassCard>

            <GlassCard className="p-6 animate-enter delay-[400ms]">
              <GlowingStat
                label={isZh ? "平均回报率" : "Average roi"}
                value={formatPercent(avgRoi / 100, 1)}
              />
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                {isZh
                  ? "所有上榜钱包的平均 ROI，头部表现者将整体分布向上拉升。"
                  : "Average return on investment across all ranked wallets, with top performers stretching the distribution."}
              </p>
            </GlassCard>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-6 animate-enter delay-500">
            <header className="flex items-center justify-between">
              <div className="label-subtle">
                {isZh ? "PNL 领先的钱包" : "Top winners by pnl"}
              </div>
              <div className="text-[10px] text-slate-500">
                {isZh
                  ? "这些资金贡献了更高的胜率份额"
                  : "Highlighting the capital that fuels the higher winning share"}
              </div>
            </header>
            {topWinner ? (
              <GlassCard className="mt-4 p-5 bg-neon-500/[0.03] border-neon-500/20">
                <div className="label-subtle !text-neon-300">
                  {isZh ? "PNL 冠军" : "Top PNL winner"}
                </div>
                <div className="mt-3 flex flex-col gap-1 font-mono text-xs text-white">
                  <span>
                    {isZh ? "地址" : "Address"}:{" "}
                    <a
                      href={getDebankProfileUrl(topWinner.trader)}
                      className="underline decoration-neon-400/30 underline-offset-2 hover:text-neon-400 transition"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {topWinner.trader}
                    </a>
                  </span>
                  <span>
                    {isZh ? "净利润" : "Net PNL"}:{" "}
                    <span className="text-neon-400">
                      {formatCurrency(getPnl(topWinner))}
                    </span>
                  </span>
                  <span>
                    {isZh ? "成交量" : "Volume"}:{" "}
                    {formatCurrency(topWinner.vol ?? 0)}
                  </span>
                </div>
              </GlassCard>
            ) : (
              <div className="mt-4 p-5 text-sm text-slate-500 border border-white/5 rounded-2xl">
                {isZh ? "暂无盈利钱包数据" : "No PNL data currently available."}
              </div>
            )}
            <div className="mt-5 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <div className="label-subtle">
                {isZh ? "解锁完整榜单" : "Unlock the full leaderboard"}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {isZh
                  ? "支付 $0.01 USDC（x402）后，可查看完整前十名 PNL 钱包与详尽资金流向。"
                  : "Pay $0.01 USDC via x402 to reveal the complete top 10 PNL wallets and capital flows."}
              </p>
              <Link
                href="/premium"
                className="mt-4 w-full inline-flex items-center justify-center rounded-lg bg-neon-500 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-void-900 transition hover:bg-neon-400 active:scale-95"
              >
                {isZh ? "立即解锁" : "Unlock for $0.01"}
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="p-6 animate-enter delay-600">
            <header className="flex items-center justify-between">
              <div className="label-subtle">
                {isZh ? "ROI 表现最强的钱包" : "Highest roi streak"}
              </div>
              <div className="text-[10px] text-slate-500">
                {isZh
                  ? "持续盈利的钱包强化更高的胜率"
                  : "Consistently positive wallets support the higher win narrative"}
              </div>
            </header>
            {topRoiLeader ? (
              <GlassCard className="mt-4 p-5 bg-neon-500/[0.03] border-neon-500/20">
                <div className="label-subtle !text-neon-300">
                  {isZh ? "ROI 冠军" : "Top ROI streak"}
                </div>
                <div className="mt-3 flex flex-col gap-1 font-mono text-xs text-white">
                  <span>
                    {isZh ? "地址" : "Address"}:{" "}
                    <a
                      href={getDebankProfileUrl(topRoiLeader.trader)}
                      className="underline decoration-neon-400/30 underline-offset-2 hover:text-neon-400 transition"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {topRoiLeader.trader}
                    </a>
                  </span>
                  <span>
                    ROI:{" "}
                    <span className="text-neon-400">
                      {formatPercent((topRoiLeader.roi ?? 0) / 100, 1)}
                    </span>
                  </span>
                  <span>
                    {isZh ? "成交量" : "Volume"}:{" "}
                    {formatCurrency(topRoiLeader.vol ?? 0)}
                  </span>
                </div>
              </GlassCard>
            ) : (
              <div className="mt-4 p-5 text-sm text-slate-500 border border-white/5 rounded-2xl">
                {isZh ? "暂无 ROI 数据" : "No ROI data currently available."}
              </div>
            )}
            <div className="mt-5 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <div className="label-subtle">
                {isZh ? "更多 ROI 洞察" : "More ROI insights"}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {isZh
                  ? "支付 $0.01 USDC（x402）可解锁完整前十 ROI 地址、净额与交易节奏。"
                  : "Unlock for $0.01 USDC via x402 to access the full top 10 ROI wallets with granular net flows."}
              </p>
              <Link
                href="/premium"
                className="mt-4 w-full inline-flex items-center justify-center rounded-lg bg-neon-500 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-void-900 transition hover:bg-neon-400 active:scale-95"
              >
                {isZh ? "立即解锁" : "Unlock for $0.01"}
              </Link>
            </div>
          </GlassCard>
        </section>

        <section className="animate-enter delay-700">
          <GlassCard className="p-8 bg-gradient-to-br from-void-800 to-neon-500/5">
            <h2 className="label-subtle">
              {isZh ? "关键结论" : "Key takeaways"}
            </h2>
            <div className="mt-6 grid gap-6 text-sm text-slate-300 md:grid-cols-3">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-neon-500/20 transition">
                <h3 className="label-subtle !text-neon-300 mb-2">
                  {isZh ? "胜方掌控" : "Winning control"}
                </h3>
                <p className="leading-relaxed">
                  {isZh
                    ? `盈利资金贡献了 ${formatPercent(
                      weightedWinningRate,
                      1,
                    )} 的成交量，显示市场方向由胜方主导。`
                    : `Winners account for ${formatPercent(
                      weightedWinningRate,
                      1,
                    )} of traded volume, underscoring that profitable capital is steering the market direction.`}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-neon-500/20 transition">
                <h3 className="label-subtle !text-neon-300 mb-2">
                  {isZh ? "利润集中" : "Concentrated profits"}
                </h3>
                <p className="leading-relaxed">
                  {isZh
                    ? `前列钱包合计斩获 ${formatCurrency(
                      topPnlTotal,
                    )} 的收益，足以让整体情绪明显转多。`
                    : `The top PNL wallets alone contribute ${formatCurrency(
                      topPnlTotal,
                    )} in gains—enough to tilt aggregate sentiment decisively upward.`}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-neon-500/20 transition">
                <h3 className="label-subtle !text-neon-300 mb-2">
                  {isZh ? "动能优势" : "Momentum advantage"}
                </h3>
                <p className="leading-relaxed">
                  {isZh
                    ? `盈利方拿下的净额 ${formatCurrency(
                      winningNet,
                    )} 占总净额的 ${formatPercent(
                      netMomentumShare,
                      1,
                    )}，延续更高胜率的趋势。`
                    : `Net capital captured by winners (${formatCurrency(
                      winningNet,
                    )}) represents ${formatPercent(
                      netMomentumShare,
                      1,
                    )} of the total net, reinforcing the higher win momentum in the order flow.`}
                </p>
              </div>
            </div>
          </GlassCard>
        </section>
      </div>
    </div>
  );
}
