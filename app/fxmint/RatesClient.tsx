"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  InterestRateChart,
  RANGE_OPTIONS,
} from "@/app/components/InterestRateChart";
import type { RateSeries } from "@/lib/rates";

type Language = "en" | "zh";

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

export function RatesClient({ data }: { data: RateSeries }) {
  const [language, setLanguage] = useState<Language>("en");
  const [rangeId, setRangeId] = useState<RangeId>("1y");
  const isZh = language === "zh";
  const hasData = data.series.length > 0;

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
