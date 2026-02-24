"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { DashboardMetrics, Trader } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowingStat } from "@/components/ui/GlowingStat";
import { Navbar } from "@/components/ui/Navbar";
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


/* ─── Terminal Box ─── */
function TerminalBox({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        </div>
        <span className="font-mono text-[11px] text-white/30">{title}</span>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-500 animate-pulse" />
        </div>
      </div>
      {/* Content */}
      <div className="p-5 font-mono text-[13px] leading-relaxed text-white/70 space-y-3">
        {children}
      </div>
    </div>
  );
}

/* ─── Terminal Line ─── */
function TerminalLine({
  command,
  output,
}: {
  command: string;
  output?: React.ReactNode;
}) {
  return (
    <div>
      <div>
        <span className="text-neon-500">$</span>{" "}
        <span className="text-white/90">{command}</span>
      </div>
      {output && <div className="mt-1 text-white/50 pl-3">{output}</div>}
    </div>
  );
}

/* ─── Main Dashboard ─── */
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

  if (!totalTraders) {
    return (
      <div className="min-h-screen bg-black text-white/80">
        <Navbar
          language={language}
          onLanguageChange={setLanguage}
          isZh={isZh}
        />
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-20">
          <GlassCard className="p-10 text-center">
            <h1 className="text-2xl font-semibold text-white">
              {isZh ? "没有可展示的数据" : "No data available"}
            </h1>
            <p className="mt-3 text-sm text-white/40">
              {isZh
                ? "请先更新 fx_leaderboard_all.json，然后刷新页面。"
                : "Update fx_leaderboard_all.json and reload the page to see the dashboard."}
            </p>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white/80 relative overflow-hidden">
      {/* Background Glow */}
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-neon-500/[0.04] blur-[150px] rounded-full pointer-events-none" />

      <Navbar
        language={language}
        onLanguageChange={setLanguage}
        isZh={isZh}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col px-6 pt-16 pb-20 relative z-10">
        {/* ═══════ HERO SECTION ═══════ */}
        <section className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center animate-enter">
          {/* Left — Headline */}
          <div className="flex flex-col gap-6">
            <div className="label-subtle !text-neon-400/70">
              {isZh ? "跨协议聪明钱包追踪" : "Cross-Protocol Smart Wallet Tracking"}
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl tracking-tight leading-[1.1]">
              {isZh ? (
                <>
                  追踪聪明钱包
                  <br />
                  <span className="text-neon-400">跨协议洞察。</span>
                </>
              ) : (
                <>
                  Track smart wallets
                  <br />
                  <span className="text-neon-400">across protocols.</span>
                </>
              )}
            </h1>
            <p className="max-w-lg text-sm text-white/40 leading-relaxed">
              {isZh
                ? "通过深挖各协议 Leaderboard 中的聪明钱包动向，汇总跨协议的 PNL、ROI 与资金流信号，给你更有参考性的交易指标。"
                : "Aggregate PNL, ROI, and capital flow signals by mining smart wallet activity across protocol leaderboards—delivering trading indicators with real edge."}
            </p>

            {/* SKILL.md location + copy */}
            <div className="flex items-stretch rounded-lg border border-white/[0.08] bg-[#0a0a0a] overflow-hidden max-w-md">
              <div className="flex items-center gap-2 px-4 py-3 font-mono text-[13px] flex-1 min-w-0">
                <span className="text-neon-500 shrink-0">SKILL</span>
                <span className="text-white/50 truncate">
                  /SKILL.md
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/SKILL.md`;
                  navigator.clipboard.writeText(url).then(() => {
                    const btn = document.getElementById("copy-skill-btn");
                    if (btn) {
                      btn.textContent = isZh ? "已复制 ✓" : "Copied ✓";
                      setTimeout(() => {
                        btn.textContent = isZh ? "复制给 Agent" : "Copy to Agent";
                      }, 2000);
                    }
                  });
                }}
                id="copy-skill-btn"
                className="flex items-center px-4 border-l border-white/[0.06] text-xs font-medium text-neon-400 hover:bg-neon-500/[0.06] transition shrink-0 cursor-pointer"
              >
                {isZh ? "复制给 Agent" : "Copy to Agent"}
              </button>
            </div>
          </div>

          {/* Right — Terminal Stats */}
          <TerminalBox title="smartclaw API · f(x) protocol" className="animate-enter delay-200">
            <TerminalLine
              command="GET /api/fx/status"
              output={
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <span>
                    {isZh ? "参与地址" : "tracked wallets"}:{" "}
                    <span className="text-neon-400">
                      {formatNumber(totalTraders)}
                    </span>
                  </span>
                  <span>
                    {isZh ? "盈利账户" : "winners"}:{" "}
                    <span className="text-neon-400">
                      {formatNumber(winningCount)}
                    </span>
                  </span>
                  <span>
                    {isZh ? "加权胜率" : "weighted win rate"}:{" "}
                    <span className="text-neon-400">
                      {formatPercent(weightedWinningRate, 1)}
                    </span>
                  </span>
                  <span>
                    {isZh ? "总成交量" : "total volume"}:{" "}
                    <span className="text-neon-400">
                      {formatCurrency(totalVol)}
                    </span>
                  </span>
                </div>
              }
            />
            <TerminalLine
              command="GET /api/fx/top-pnl?limit=1"
              output={
                topWinner ? (
                  <span>
                    {topWinner.trader.slice(0, 10)}…{" "}
                    <span className="text-neon-400">
                      {formatCurrency(getPnl(topWinner))}
                    </span>{" "}
                    PNL · {formatCurrency(topWinner.vol ?? 0)} vol
                  </span>
                ) : (
                  "no data"
                )
              }
            />
            <TerminalLine
              command="GET /api/fx/top-pnl?sort=roi&limit=1"
              output={
                topRoiLeader ? (
                  <span>
                    {topRoiLeader.trader.slice(0, 10)}…{" "}
                    <span className="text-neon-400">
                      {formatPercent((topRoiLeader.roi ?? 0) / 100, 1)}
                    </span>{" "}
                    ROI · {formatCurrency(topRoiLeader.vol ?? 0)} vol
                  </span>
                ) : (
                  "no data"
                )
              }
            />
          </TerminalBox>
        </section>

        {/* ═══════ PREMIUM CTA ═══════ */}
        <hr className="section-divider my-14" />

        <section className="animate-enter delay-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-neon-500/20 bg-neon-500/[0.03] px-6 py-5">
            <div className="max-w-xl text-sm text-white/60">
              {isZh ? (
                <>
                  支付{" "}
                  <span className="font-semibold text-neon-400">
                    $0.01 USDC
                  </span>
                  （通过 x402 支付流）解锁完整的 PNL 与 ROI
                  前十名钱包、净额与动能脉冲。
                </>
              ) : (
                <>
                  Unlock the full Top 10 PNL and ROI cohorts for{" "}
                  <span className="font-semibold text-neon-400">
                    $0.01 USDC
                  </span>{" "}
                  via the x402 payment flow.
                </>
              )}
            </div>
            <Link
              href="/premium"
              className="inline-flex items-center justify-center rounded-lg bg-neon-500 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:bg-neon-400 active:scale-[0.97] shrink-0"
            >
              {isZh ? "立即解锁" : "Unlock Now"}
            </Link>
          </div>
        </section>

        {/* ═══════ PROTOCOL SELECTOR ═══════ */}
        <hr className="section-divider my-14" />

        <section className="animate-enter delay-200">
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <div className="flex items-center gap-2 rounded-lg border border-neon-500/30 bg-neon-500/[0.06] px-4 py-2">
              <div className="relative h-5 w-5 shrink-0">
                <Image
                  src="/fx-protocol-icon.svg"
                  alt="f(x) Protocol"
                  fill
                  sizes="20px"
                />
              </div>
              <span className="text-xs font-semibold text-neon-400">f(x) Protocol</span>
              <span className="rounded-full bg-neon-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neon-400">
                {isZh ? "已接入" : "Live"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 opacity-40">
              <span className="text-xs font-medium text-white/50">Perp DEX</span>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/30">
                {isZh ? "即将上线" : "Soon"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 opacity-40">
              <span className="text-xs font-medium text-white/50">Meme Coins</span>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/30">
                {isZh ? "即将上线" : "Soon"}
              </span>
            </div>
          </div>
        </section>

        {/* ═══════ CORE METRICS ═══════ */}

        <section className="grid gap-8 lg:grid-cols-[2fr_3fr] animate-enter delay-200">
          {/* Weighted Win Rate — Hero Card */}
          <GlassCard className="p-8 border-neon-500/10 bg-neon-500/[0.02]">
            <span className="label-subtle !text-neon-400/70">
              {isZh ? "按成交量加权的胜率" : "Volume-weighted winning rate"}
            </span>
            <div className="mt-5 flex items-end gap-4">
              <span className="text-5xl font-mono text-white drop-shadow-[0_0_12px_rgba(0,255,157,0.2)]">
                {formatPercent(weightedWinningRate, 1)}
              </span>
              <span className="text-sm text-white/30 mb-2">
                {isZh
                  ? "由盈利钱包贡献"
                  : "of volume from winning traders"}
              </span>
            </div>
            <p className="mt-5 text-sm text-white/40 leading-relaxed">
              {isZh ? (
                hasMajorityMomentum ? (
                  <>
                    尽管只有 {formatPercent(winningRate, 1)} 的账户处于盈利，
                    它们的成交量已经占据主导。
                  </>
                ) : (
                  <>
                    尽管只有 {formatPercent(winningRate, 1)} 的账户处于盈利，
                    但成交量正在迅速逼近亏损方。
                  </>
                )
              ) : hasMajorityMomentum ? (
                <>
                  Only {formatPercent(winningRate, 1)} of accounts are net
                  positive, yet their flow drives the majority of market
                  liquidity.
                </>
              ) : (
                <>
                  Only {formatPercent(winningRate, 1)} of accounts are net
                  positive, but their flow is rapidly closing the gap with
                  losing volume.
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

          {/* Secondary Metric Cards */}
          <div className="grid gap-6 sm:grid-cols-2">
            <GlassCard className="p-6 animate-enter delay-100">
              <div className="label-subtle">
                {isZh ? "账户结构" : "Trader mix"}
              </div>
              <div className="mt-4 text-3xl font-mono text-white">
                {formatNumber(winningCount)}{" "}
                <span className="text-base text-white/30">
                  {isZh ? "个盈利" : "winners"}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/35">
                {isZh
                  ? `在 ${formatNumber(totalTraders)} 个地址中，${formatPercent(winningRate, 1)} 录得盈利。`
                  : `${formatPercent(winningRate, 1)} of ${formatNumber(totalTraders)} tracked wallets in profit.`}
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
              <p className="mt-2 text-sm text-white/35">
                {isZh
                  ? "盈利资金捕获的累计净额占比。"
                  : "Net capital captured by profit-making traders."}
              </p>
              <dl className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="label-subtle">
                    {isZh ? "盈利净额" : "Winning net"}
                  </span>
                  <span className="font-mono text-sm text-white/70">
                    {formatCurrency(winningNet)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="label-subtle">
                    {isZh ? "整体净额" : "Total net"}
                  </span>
                  <span className="font-mono text-sm text-white/70">
                    {formatCurrency(totalNet)}
                  </span>
                </div>
              </dl>
            </GlassCard>

            <GlassCard className="p-6 animate-enter delay-300">
              <GlowingStat
                label={isZh ? "累计盈亏" : "Aggregate PNL"}
                value={formatCurrency(totalPnl)}
              />
              <p className="mt-4 text-sm text-white/35 leading-relaxed">
                {isZh
                  ? "当前榜单下的总盈利。头部地址集中获利。"
                  : "Gross profit across the leaderboard. Concentrated among top performers."}
              </p>
            </GlassCard>

            <GlassCard className="p-6 animate-enter delay-400">
              <GlowingStat
                label={isZh ? "平均回报率" : "Average ROI"}
                value={formatPercent(avgRoi / 100, 1)}
              />
              <p className="mt-4 text-sm text-white/35 leading-relaxed">
                {isZh
                  ? "所有上榜钱包的平均 ROI。"
                  : "Average ROI across all ranked wallets."}
              </p>
            </GlassCard>
          </div>
        </section>

        {/* ═══════ LEADERBOARD PREVIEW ═══════ */}
        <hr className="section-divider my-14" />

        <section className="grid gap-8 lg:grid-cols-2 animate-enter delay-300">
          {/* PNL Leader */}
          <GlassCard className="p-6">
            <header className="flex items-center justify-between">
              <div className="label-subtle !text-neon-400/70">
                {isZh ? "PNL 领先钱包" : "Top winners by PNL"}
              </div>
              <div className="text-[10px] text-white/20 uppercase tracking-wider">
                {isZh ? "#1 排名" : "#1 ranked"}
              </div>
            </header>
            {topWinner ? (
              <div className="mt-5 rounded-xl border border-neon-500/10 bg-neon-500/[0.02] p-5">
                <div className="label-subtle !text-neon-400 mb-3">
                  {isZh ? "PNL 冠军" : "Top PNL Winner"}
                </div>
                <div className="flex flex-col gap-2 font-mono text-xs text-white/80">
                  <span>
                    <span className="text-white/30">
                      {isZh ? "地址" : "addr"}:
                    </span>{" "}
                    <a
                      href={getDebankProfileUrl(topWinner.trader)}
                      className="underline decoration-white/10 underline-offset-2 hover:text-neon-400 transition"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {topWinner.trader}
                    </a>
                  </span>
                  <span>
                    <span className="text-white/30">pnl:</span>{" "}
                    <span className="text-neon-400">
                      {formatCurrency(getPnl(topWinner))}
                    </span>
                  </span>
                  <span>
                    <span className="text-white/30">vol:</span>{" "}
                    {formatCurrency(topWinner.vol ?? 0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-5 p-5 text-sm text-white/20 border border-white/[0.04] rounded-xl">
                {isZh ? "暂无盈利钱包数据" : "No PNL data available."}
              </div>
            )}
            <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="label-subtle">
                {isZh ? "解锁完整榜单" : "Unlock full leaderboard"}
              </div>
              <p className="mt-2 text-xs text-white/30">
                {isZh
                  ? "支付 $0.01 USDC（x402）后，可查看完整前十名 PNL 钱包。"
                  : "Pay $0.01 USDC via x402 for the complete top 10 PNL wallets."}
              </p>
              <Link
                href="/premium"
                className="mt-4 w-full inline-flex items-center justify-center rounded-lg bg-neon-500 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition hover:bg-neon-400 active:scale-[0.97]"
              >
                {isZh ? "立即解锁" : "Unlock for $0.01"}
              </Link>
            </div>
          </GlassCard>

          {/* ROI Leader */}
          <GlassCard className="p-6">
            <header className="flex items-center justify-between">
              <div className="label-subtle !text-neon-400/70">
                {isZh ? "ROI 最强钱包" : "Highest ROI streak"}
              </div>
              <div className="text-[10px] text-white/20 uppercase tracking-wider">
                {isZh ? "#1 排名" : "#1 ranked"}
              </div>
            </header>
            {topRoiLeader ? (
              <div className="mt-5 rounded-xl border border-neon-500/10 bg-neon-500/[0.02] p-5">
                <div className="label-subtle !text-neon-400 mb-3">
                  {isZh ? "ROI 冠军" : "Top ROI Streak"}
                </div>
                <div className="flex flex-col gap-2 font-mono text-xs text-white/80">
                  <span>
                    <span className="text-white/30">
                      {isZh ? "地址" : "addr"}:
                    </span>{" "}
                    <a
                      href={getDebankProfileUrl(topRoiLeader.trader)}
                      className="underline decoration-white/10 underline-offset-2 hover:text-neon-400 transition"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {topRoiLeader.trader}
                    </a>
                  </span>
                  <span>
                    <span className="text-white/30">roi:</span>{" "}
                    <span className="text-neon-400">
                      {formatPercent((topRoiLeader.roi ?? 0) / 100, 1)}
                    </span>
                  </span>
                  <span>
                    <span className="text-white/30">vol:</span>{" "}
                    {formatCurrency(topRoiLeader.vol ?? 0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-5 p-5 text-sm text-white/20 border border-white/[0.04] rounded-xl">
                {isZh ? "暂无 ROI 数据" : "No ROI data available."}
              </div>
            )}
            <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="label-subtle">
                {isZh ? "更多 ROI 洞察" : "More ROI insights"}
              </div>
              <p className="mt-2 text-xs text-white/30">
                {isZh
                  ? "支付 $0.01 USDC（x402）可解锁完整前十 ROI 地址。"
                  : "Unlock for $0.01 USDC via x402 for the full top 10 ROI wallets."}
              </p>
              <Link
                href="/premium"
                className="mt-4 w-full inline-flex items-center justify-center rounded-lg bg-neon-500 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition hover:bg-neon-400 active:scale-[0.97]"
              >
                {isZh ? "立即解锁" : "Unlock for $0.01"}
              </Link>
            </div>
          </GlassCard>
        </section>

        {/* ═══════ KEY TAKEAWAYS ═══════ */}
        <hr className="section-divider my-14" />

        <section className="animate-enter delay-400">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isZh ? "为什么选择 Smartclaw" : "Why Smartclaw"}
            </h2>
            <p className="mt-2 text-sm text-white/30">
              {isZh
                ? "API 驱动的智能钱包追踪，为 AI Agent 打造"
                : "API-powered smart wallet tracking, built for AI agents."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 01 */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-neon-400 font-mono text-sm font-bold">
                  01
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">
                {isZh ? "Agent 友好" : "Agent-First API"}
              </h3>
              <p className="text-sm text-white/35 leading-relaxed">
                {isZh
                  ? "复制 SKILL.md 给你的 AI Agent，即可通过 REST API 查询智能钱包数据——无需配置，开箱即用。"
                  : "Copy SKILL.md to your AI agent and start querying smart wallet data via REST API — no setup, works out of the box."}
              </p>
            </GlassCard>

            {/* Card 02 */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-neon-400 font-mono text-sm font-bold">
                  02
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">
                {isZh ? "协议命名空间" : "Protocol-Namespaced"}
              </h3>
              <p className="text-sm text-white/35 leading-relaxed">
                {isZh
                  ? `f(x) Protocol 已上线 (/api/fx/)。Perp DEX 和 Meme Coin 即将到来——结构统一，无缝扩展。`
                  : `f(x) Protocol is live at /api/fx/. Perp DEX and Meme Coins coming soon — same structure, seamless expansion.`}
              </p>
            </GlassCard>

            {/* Card 03 */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-neon-400 font-mono text-sm font-bold">
                  03
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">
                {isZh ? "实时链上数据" : "Real-Time On-Chain Data"}
              </h3>
              <p className="text-sm text-white/35 leading-relaxed">
                {isZh
                  ? `追踪 ${formatNumber(totalTraders)} 个钱包，${formatCurrency(totalVol)} 成交量——数据来自链上快照，而非延迟聚合。`
                  : `Tracking ${formatNumber(totalTraders)} wallets across ${formatCurrency(totalVol)} in volume — sourced from on-chain snapshots, not delayed aggregation.`}
              </p>
            </GlassCard>
          </div>
        </section>

        {/* ═══════ FOOTER ═══════ */}
        <hr className="section-divider my-14" />

        <footer className="text-center text-xs text-white/15 font-mono">
          smartclaw · {isZh ? "跨协议聪明钱包追踪" : "Cross-Protocol Smart Wallet Tracker"} · Powered by x402
        </footer>
      </div >
    </div >
  );
}
