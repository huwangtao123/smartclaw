"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  InterestRateChart,
  RANGE_OPTIONS,
} from "@/app/components/InterestRateChart";
import type { RateSeries } from "@/lib/rates";

type Language = "en" | "zh";
type Collateral = "WBTC" | "wstETH";

type RangeId = (typeof RANGE_OPTIONS)[number]["id"];

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "—";
  return `${value.toFixed(3)}%`;
}

function formatRate(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "—";
  return `${value.toFixed(2)}% APR`;
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "—";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function LanguageToggle({
  language,
  onChange,
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-slate-700 bg-slate-900/70 p-1 text-xs font-medium text-slate-300">
      {["en", "zh"].map((code) => {
        const isActive = language === code;
        const label = code === "en" ? "EN" : "中文";
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code as Language)}
            className={`rounded-full px-3 py-1 transition ${
              isActive
                ? "bg-emerald-400 text-slate-900"
                : "hover:bg-slate-800/80 hover:text-slate-100"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function RatesPageError({ language }: { language: Language }) {
  const isZh = language === "zh";
  return (
    <div className="rounded-3xl border border-rose-400/40 bg-rose-500/10 p-10 text-center text-rose-50">
      <h1 className="text-2xl font-semibold">
        {isZh ? "无法加载利率数据" : "Unable to load rate data"}
      </h1>
      <p className="mt-3 text-sm text-rose-50/80">
        {isZh
          ? "请稍后再试，或在项目根目录提供离线 CSV 文件。"
          : "Try again later or provide an offline CSV file in the project root."}
      </p>
    </div>
  );
}

function getRangeDays(rangeId: RangeId) {
  const option = RANGE_OPTIONS.find((opt) => opt.id === rangeId);
  return option?.days ?? null;
}

function averageRateForWindow(
  series: RateSeries["series"],
  key: "fxusdBorrow" | "aaveBorrow",
  windowDays: number,
) {
  if (!series.length) return null;
  const latest = new Date(`${series[series.length - 1].date}T00:00:00Z`);
  const cutoff = new Date(latest);
  cutoff.setUTCDate(cutoff.getUTCDate() - Math.max(0, windowDays));
  let sum = 0;
  let count = 0;
  for (let i = series.length - 1; i >= 0; i -= 1) {
    const point = series[i];
    const d = new Date(`${point.date}T00:00:00Z`);
    if (d < cutoff) break;
    const value = point[key];
    if (value !== null && value !== undefined && Number.isFinite(value)) {
      sum += value;
      count += 1;
    }
  }
  if (count === 0) return null;
  return sum / count;
}

function getLatestRate(series: RateSeries["series"], key: "fxusdBorrow" | "aaveBorrow") {
  for (let i = series.length - 1; i >= 0; i -= 1) {
    const value = series[i]?.[key];
    if (value !== null && value !== undefined && Number.isFinite(value)) {
      return value as number;
    }
  }
  return null;
}

export function RatesClient({ data }: { data: RateSeries }) {
  const [language, setLanguage] = useState<Language>("en");
  const [rangeId, setRangeId] = useState<RangeId>("1y");
  const [amount, setAmount] = useState<number>(10000);
  const [days, setDays] = useState<number>(30);
  const [collateral, setCollateral] = useState<Collateral>("WBTC");
  const isZh = language === "zh";
  const hasData = data.series.length > 0;
  const latestFxApr = getLatestRate(data.series, "fxusdBorrow");
  const latestAaveApr = getLatestRate(data.series, "aaveBorrow");
  const windowFxApr = averageRateForWindow(data.series, "fxusdBorrow", days);
  const windowAaveApr = averageRateForWindow(data.series, "aaveBorrow", days);

  const feeConfig = {
    open: {
      WBTC: 0.008,
      wstETH: 0.005,
    } as Record<Collateral, number>,
    close: 0.002,
    waiverUntil: new Date("2025-12-30T00:00:00Z"),
  };
  const isWaived = Date.now() < feeConfig.waiverUntil.getTime();

  const fxSim = useMemo(() => {
    const apr = windowFxApr ?? latestFxApr ?? 0;
    const openRate = feeConfig.open[collateral];
    const principal = Math.max(0, amount);
    const termYears = Math.max(0, days) / 365;
    const interest = principal * (apr / 100) * termYears;
    const openFeeRaw = principal * openRate;
    const openFee = isWaived ? 0 : openFeeRaw;
    const closeFee = (principal + interest) * feeConfig.close;
    const total = interest + openFee + closeFee;
    const effRate = principal > 0 ? (total / principal) * 100 : 0;
    return { apr, interest, openFee, openFeeRaw, closeFee, total, effRate, openRate };
  }, [amount, collateral, days, feeConfig.close, feeConfig.open, isWaived, latestFxApr, windowFxApr]);

  const aaveSim = useMemo(() => {
    const apr = windowAaveApr ?? latestAaveApr ?? 0;
    const principal = Math.max(0, amount);
    const termYears = Math.max(0, days) / 365;
    const interest = principal * (apr / 100) * termYears;
    const openFee = 0;
    const closeFee = 0;
    const total = interest + openFee + closeFee;
    const effRate = principal > 0 ? (total / principal) * 100 : 0;
    return { apr, interest, openFee, closeFee, total, effRate };
  }, [amount, days, latestAaveApr, windowAaveApr]);

  const filteredSeries = useMemo(() => {
    if (!hasData) return [];
    const days = getRangeDays(rangeId);
    if (!days) return data.series;

    const latestPoint = data.series[data.series.length - 1];
    const latestDate = latestPoint
      ? new Date(`${latestPoint.date}T00:00:00Z`)
      : new Date();
    const cutoff = new Date(latestDate);
    cutoff.setUTCDate(cutoff.getUTCDate() - days);

    return data.series.filter((point) => {
      const pointDate = new Date(`${point.date}T00:00:00Z`);
      return pointDate >= cutoff && pointDate <= latestDate;
    });
  }, [data.series, hasData, rangeId]);

  const averageCard = useMemo(() => {
    if (!hasData || filteredSeries.length === 0) return null;
    const denom = filteredSeries.length || 1;
    const fxAvg =
      filteredSeries.reduce((acc, point) => acc + (point.fxusdBorrow ?? 0), 0) /
      denom;
    const aaveAvg =
      filteredSeries.reduce((acc, point) => acc + (point.aaveBorrow ?? 0), 0) /
      denom;
    const crvAvg =
      filteredSeries.reduce((acc, point) => acc + (point.crvusdAvg ?? 0), 0) /
      denom;
    return { fxAvg, aaveAvg, crvAvg };
  }, [filteredSeries, hasData]);

  const tableRows = useMemo(() => {
    if (!hasData) return [];
    return filteredSeries.map((point) => {
      const primaryParts = [
        {
          label: "fxUSD",
          value: formatPercent(point.fxusdBorrow),
          highlight: true,
        },
        {
          label: "Aave",
          value: formatPercent(point.aaveBorrow),
        },
        {
          label: "crvUSD(WBTC)",
          value: formatPercent(point.crvusdAvg),
        },
      ];
      return {
        date: point.date,
        protocol: "Daily",
        kind: "snapshot",
        parts: primaryParts,
      };
    });
  }, [data.maWindow, filteredSeries, hasData]);

  const rangeLabel = useMemo(() => {
    const option = RANGE_OPTIONS.find((opt) => opt.id === rangeId);
    if (!option || option.id === "max") {
      return isZh ? "全周期均值" : "All-time Average";
    }
    return `${option.label} Average`;
  }, [isZh, rangeId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <div className="flex items-center justify-between">
          <LanguageToggle language={language} onChange={setLanguage} />
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
              {isZh ? "离线数据已加载" : "Offline data loaded"}
            </span>
            <span className="rounded-full border border-slate-300/30 bg-slate-800/80 px-3 py-1 text-slate-100">
              {isZh
                ? "实时 API + 离线 CSV 兜底"
                : "Live API + offline CSV fallback"}
            </span>
          </div>
        </div>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative h-14 w-14 shrink-0">
            <Image
              src="/fx-protocol-icon.svg"
              alt="f(x) Protocol logo"
              fill
              sizes="56px"
              priority
            />
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300/80">
              {isZh ? "借贷利率对比" : "Lending Rate Comparison"}
            </div>
            <h1 className="mt-2 text-4xl font-semibold text-slate-50 sm:text-5xl">
              {isZh
                ? "fxUSD vs Aave USDC vs crvUSD(WBTC)"
                : "fxUSD vs Aave USDC vs crvUSD(WBTC)"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
              {isZh
                ? "对比 fxUSD、Aave USDC、crvUSD(WBTC) 借款利率，支持原始曲线与移动均线，便于观察趋势与偏离。"
                : "Compare fxUSD, Aave USDC, and crvUSD(WBTC) borrow APR with raw curves and moving averages to spot trends and deviations."}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {isZh
                ? "默认使用离线 CSV 数据，如在线源可用则自动刷新。"
                : "Uses offline CSV snapshots by default, refreshing from live sources when available."}
            </p>
          </div>
        </header>

        <div className="space-y-4">
          <div className="rounded-3xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm text-emerald-50">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs uppercase tracking-[0.32em] text-emerald-200/80">
                {rangeLabel}
              </span>
              {averageCard ? (
                <>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-50">
                    {isZh ? "fxUSD" : "fxUSD"} · {averageCard.fxAvg.toFixed(3)}%
                  </span>
                  <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs">
                    {isZh ? "Aave USDC" : "Aave USDC"} ·{" "}
                    {averageCard.aaveAvg.toFixed(3)}%
                  </span>
                  <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs">
                    {isZh ? "crvUSD(WBTC)" : "crvUSD(WBTC)"} ·{" "}
                    {averageCard.crvAvg.toFixed(3)}%
                  </span>
                </>
              ) : (
                <span className="text-xs text-emerald-100/70">
                  {isZh ? "暂无数据" : "No data yet"}
                </span>
              )}
            </div>
          </div>

          {hasData ? (
            <InterestRateChart
              series={data.series}
              lastUpdated={data.lastUpdated}
              source={data.source}
              maWindow={data.maWindow}
              rangeHint={data.rangeHint}
              language={language}
              selectedRangeId={rangeId}
              onRangeChange={(id) => setRangeId(id as RangeId)}
            />
          ) : (
            <RatesPageError language={language} />
          )}

          <div className="rounded-2xl border border-emerald-300/30 bg-slate-900/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.32em] text-emerald-200/80">
                  {isZh ? "成本模拟器" : "Cost simulator"}
                </div>
                <h3 className="text-lg font-semibold text-emerald-50">
                  {isZh
                    ? "fxMINT 开仓/还款成本估算"
                    : "Estimate fxMINT open/close costs"}
                </h3>
                <p className="text-xs text-slate-300">
                  {isZh
                    ? "参考过去窗口平均 APR 估算利息，未考虑复利（仅供参考）。"
                    : "Uses past-window average APR for interest estimate; no compounding (reference only, not financial advice)."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { label: "7d", value: 7 },
                  { label: "30d", value: 30 },
                  { label: "90d", value: 90 },
                  { label: "180d", value: 180 },
                  { label: "365d", value: 365 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDays(preset.value)}
                    className={`rounded-full border px-3 py-1 ${
                      days === preset.value
                        ? "border-emerald-300 bg-emerald-400/20 text-emerald-50"
                        : "border-emerald-300/30 text-emerald-100/70 hover:border-emerald-200/60 hover:text-emerald-50"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_1fr]">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  {(["WBTC", "wstETH"] as Collateral[]).map((asset) => (
                    <button
                      key={asset}
                      type="button"
                      onClick={() => setCollateral(asset)}
                      className={`rounded-full border px-3 py-1 ${
                        collateral === asset
                          ? "border-emerald-300 bg-emerald-400/20 text-emerald-50"
                          : "border-emerald-300/30 text-emerald-100/70 hover:border-emerald-200/60 hover:text-emerald-50"
                      }`}
                    >
                      {asset} {isZh ? "作为抵押" : "collateral"}
                    </button>
                  ))}
                </div>
                <label className="block text-xs uppercase tracking-[0.22em] text-slate-400">
                  {isZh ? "借款金额 (USDC)" : "Borrow amount (USDC)"}
                  <input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-emerald-400/40 focus:border-emerald-300 focus:ring-2"
                  />
                </label>
                <label className="block text-xs uppercase tracking-[0.22em] text-slate-400">
                  {isZh ? "持有天数" : "Holding days"}
                  <input
                    type="number"
                    min={0}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value) || 0)}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-emerald-400/40 focus:border-emerald-300 focus:ring-2"
                  />
                </label>
                <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-50">
                  {isWaived ? (
                    <span>
                      {isZh
                        ? "开仓费已免除，截止 2025-12-30（仍显示原费用以便对比）"
                        : "Open fee waived until 2025-12-30 (showing original for comparison)"}
                    </span>
                  ) : (
                    <span>
                      {isZh
                        ? `开仓费 ${feeConfig.open[collateral] * 100}% ，还款费 0.2%`
                        : `Open fee ${feeConfig.open[collateral] * 100}%, close fee 0.2%`}
                    </span>
                  )}
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>{isZh ? "总成本对比" : "Total cost comparison"}</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {[
                      { label: "fxMINT", value: fxSim.total, color: "bg-emerald-400" },
                      { label: "Aave", value: aaveSim.total, color: "bg-slate-400" },
                    ].map((item) => {
                      const max = Math.max(fxSim.total, aaveSim.total, 1);
                      const width = Math.max(4, Math.min(100, (item.value / max) * 100));
                      return (
                        <div key={item.label}>
                          <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-400">
                            <span>{item.label}</span>
                            <span className="text-slate-200">{formatCurrency(item.value)}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full ${item.color}`}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                      <span>{isZh ? "使用 fxMINT 额外节省" : "Extra saved vs Aave"}</span>
                      <span className="text-emerald-100">
                        {formatCurrency(Math.max(0, aaveSim.total - fxSim.total))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-300/40 bg-slate-800/80 p-3 text-sm text-emerald-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.28em] text-emerald-200/80">
                      fxMINT (fxUSD)
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] text-emerald-50">
                      {isZh ? "窗口 APR" : "Window APR"} ·{" "}
                      {formatRate(windowFxApr ?? latestFxApr)}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-900/70 px-2 py-2">
                      <div className="text-slate-400">Open fee</div>
                      <div className="font-semibold flex items-center gap-1">
                        {isWaived ? (
                          <>
                            <span className="line-through text-slate-400">
                              {formatCurrency(fxSim.openFeeRaw)}
                            </span>
                            <span className="text-emerald-100">
                              {formatCurrency(0)}
                            </span>
                          </>
                        ) : (
                          <span>{formatCurrency(fxSim.openFee)}</span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900/70 px-2 py-2">
                      <div className="text-slate-400">Close fee</div>
                      <div className="font-semibold">
                        {formatCurrency(fxSim.closeFee)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900/70 px-2 py-2">
                      <div className="text-slate-400">Interest</div>
                      <div className="font-semibold">
                        {formatCurrency(fxSim.interest)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900/70 px-2 py-2">
                      <div className="text-slate-400">Total cost</div>
                      <div className="font-semibold text-emerald-100">
                        {formatCurrency(fxSim.total)}
                      </div>
                    </div>
                  </div>
                  {/* Current APR badge stays in the header; omit duplicate text here */}
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.28em] text-slate-400">
                      Aave USDC
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-100">
                      {isZh ? "窗口 APR" : "Window APR"} ·{" "}
                      {formatRate(windowAaveApr ?? latestAaveApr)}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-800/70 px-2 py-2">
                      <div className="text-slate-500">Open fee</div>
                      <div className="font-semibold text-slate-200">
                        {formatCurrency(aaveSim.openFee)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-800/70 px-2 py-2">
                      <div className="text-slate-500">Close fee</div>
                      <div className="font-semibold text-slate-200">
                        {formatCurrency(aaveSim.closeFee)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-800/70 px-2 py-2">
                      <div className="text-slate-500">Interest</div>
                      <div className="font-semibold text-slate-100">
                        {formatCurrency(aaveSim.interest)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-800/70 px-2 py-2">
                      <div className="text-slate-500">Total cost</div>
                      <div className="font-semibold text-slate-100">
                        {formatCurrency(aaveSim.total)}
                      </div>
                    </div>
                  </div>
                  {/* Current APR badge stays in the header; omit duplicate text here */}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
            <details open className="text-slate-100">
              <summary className="flex cursor-pointer items-center justify-between bg-slate-900/80 px-4 py-3 text-sm font-semibold">
                {isZh ? "查看当前时间窗的数据" : "View data for current window"}
                <span className="text-xs text-slate-400">
                  {tableRows.length} rows
                </span>
              </summary>
              <div className="max-h-[320px] overflow-auto">
                <table className="min-w-full text-left text-xs text-slate-200">
                  <thead className="sticky top-0 bg-slate-900">
                    <tr className="border-b border-slate-800">
                      <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em] text-slate-400">
                        date
                      </th>
                      <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em] text-slate-400">
                        protocol
                      </th>
                      <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em] text-slate-400">
                        kind
                      </th>
                      <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em] text-slate-400">
                        apr
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, index) => (
                      <tr
                        key={`${row.protocol}-${row.kind}-${row.date}-${index}`}
                        className="border-b border-slate-800/60"
                      >
                        <td className="px-4 py-2 text-slate-100">{row.date}</td>
                        <td className="px-4 py-2 text-slate-200">
                          {row.protocol}
                        </td>
                        <td className="px-4 py-2 text-slate-300">{row.kind}</td>
                        <td className="px-4 py-2 text-slate-100">
                          <div className="flex flex-wrap gap-2">
                            {row.parts.map((part) => (
                              <span
                                key={`${row.date}-${part.label}`}
                                className={`rounded-full px-2 py-1 ${
                                  part.highlight
                                    ? "bg-emerald-500/20 text-emerald-50"
                                    : "bg-slate-800/70 text-slate-200"
                                }`}
                              >
                                {part.label}: {part.value}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tableRows.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-400">
                    {isZh
                      ? "当前筛选条件下没有数据"
                      : "No data for current filters"}
                  </div>
                ) : null}
              </div>
            </details>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-300/30 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.32em] text-emerald-200/80">
                {isZh ? "最新时间戳" : "Latest timestamp"}
              </div>
              <div className="mt-2 text-lg font-semibold text-emerald-50">
                {formatDateTime(data.lastUpdated)}
              </div>
              <p className="mt-2 text-xs text-emerald-100/80">
                {isZh
                  ? "若在线源不可用，将自动使用离线 CSV/JSON。"
                  : "Falls back to offline CSV/JSON if live sources fail."}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-300/30 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.32em] text-emerald-200/80">
                {isZh ? "数据源" : "Data source"}
              </div>
              <p className="mt-2 text-xs text-emerald-100/80">
                {isZh
                  ? `当前数据源：${data.source === "fallback" ? "离线 CSV/JSON" : "在线 API"}`
                  : `Active source: ${data.source === "fallback" ? "Offline CSV/JSON" : "Live API"}`}
              </p>
              <p className="mt-2 text-xs text-emerald-100/80">
                {isZh ? "数据来源：" : "Data feed:"}{" "}
                <a
                  href="https://dune.com/queries/6297890"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-200 underline hover:text-emerald-100"
                >
                  Dune Query 6297890
                </a>{" "}
                ({isZh ? "每日运行" : "runs daily"}).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
