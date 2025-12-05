import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_MA_WINDOW = 30;
const DEFAULT_FALLBACK_FILE = "lending_rates.csv";
const MAX_STALENESS_MS = 24 * 60 * 60 * 1000; // 1 day

type SeriesMap = Map<string, number>;

export type RatePoint = {
  date: string;
  aaveBorrow: number | null;
  crvusdAvg: number | null;
  aaveMa?: number;
  crvusdMa?: number;
};

export type RateSource = "primary" | "fallback";

export type RateSeries = {
  series: RatePoint[];
  maWindow: number;
  lastUpdated: string | null;
  source: RateSource;
  rangeHint?: string;
  error?: string;
};

type RemoteRateRow = {
  timestamp?: string | number;
  time?: string | number;
  date?: string;
  value?: number;
  apy?: number;
  rate?: number;
  borrowRate?: number;
  apyBorrow?: number;
  avg?: number;
};

function toDateKey(timestamp: string | number) {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pickValue(row: RemoteRateRow) {
  for (const key of [
    "apyBorrow",
    "borrowRate",
    "apy",
    "rate",
    "avg",
    "value",
  ] as const) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function ensureArray(payload: unknown): RemoteRateRow[] {
  if (Array.isArray(payload)) return payload as RemoteRateRow[];
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return ((payload as { data: unknown[] }).data ?? []) as RemoteRateRow[];
  }
  return [];
}

function normaliseRemoteSeries(
  payload: unknown,
  valueSelector?: (row: RemoteRateRow) => number | null,
): SeriesMap {
  const rows = ensureArray(payload);
  const map: SeriesMap = new Map();

  for (const row of rows) {
    const timestamp = row.timestamp ?? row.time ?? row.date;
    if (timestamp === undefined || timestamp === null) continue;
    const dateKey = toDateKey(timestamp);
    const value =
      valueSelector?.(row) ??
      pickValue({
        ...row,
      });
    if (value === null) continue;
    map.set(dateKey, value);
  }

  return map;
}

function normaliseCsvContent(content: string): SeriesMap[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((cell) => cell.trim().toLowerCase());
  const findIdx = (...keys: string[]) =>
    header.findIndex((column) => keys.includes(column));

  const dateIdx = findIdx("date", "timestamp", "time");
  const aaveIdx = findIdx("aaveborrow", "aave_borrow_apr_pct", "aave_apr");
  const crvIdx = findIdx("crvusdavg", "crvusd_borrow_apr_pct", "crvusd_apr");

  const aaveMap: SeriesMap = new Map();
  const crvMap: SeriesMap = new Map();

  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const pick = (idx: number) =>
      idx >= 0 && idx < cells.length ? (cells[idx]?.trim() ?? "") : "";
    const dateValue = pick(dateIdx);
    if (!dateValue) continue;
    const dateKey = toDateKey(dateValue);

    const aaveRaw = pick(aaveIdx);
    const crvRaw = pick(crvIdx);
    const aave = Number(aaveRaw);
    const crv = Number(crvRaw);
    if (Number.isFinite(aave)) aaveMap.set(dateKey, aave);
    if (Number.isFinite(crv)) crvMap.set(dateKey, crv);
  }

  return [aaveMap, crvMap];
}

function mergeSeries(aave: SeriesMap, crvusd: SeriesMap): RatePoint[] {
  const dates = new Set<string>([...aave.keys(), ...crvusd.keys()]);
  const sorted = [...dates].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  return sorted.map((date) => ({
    date,
    aaveBorrow: aave.get(date) ?? null,
    crvusdAvg: crvusd.get(date) ?? null,
  }));
}

function computeMovingAverage(
  series: RatePoint[],
  window: number,
): RatePoint[] {
  if (window <= 1) return [...series];
  const aaveBuffer: number[] = [];
  const crvBuffer: number[] = [];
  const next: RatePoint[] = [];

  for (const point of series) {
    const aaveVal =
      point.aaveBorrow !== null && Number.isFinite(point.aaveBorrow)
        ? point.aaveBorrow
        : null;
    const crvVal =
      point.crvusdAvg !== null && Number.isFinite(point.crvusdAvg)
        ? point.crvusdAvg
        : null;

    if (aaveVal !== null) aaveBuffer.push(aaveVal);
    if (crvVal !== null) crvBuffer.push(crvVal);

    if (aaveBuffer.length > window) aaveBuffer.shift();
    if (crvBuffer.length > window) crvBuffer.shift();

    const clone: RatePoint = { ...point };
    if (aaveBuffer.length === window) {
      const sum = aaveBuffer.reduce((acc, val) => acc + val, 0);
      clone.aaveMa = sum / window;
    }
    if (crvBuffer.length === window) {
      const sum = crvBuffer.reduce((acc, val) => acc + val, 0);
      clone.crvusdMa = sum / window;
    }
    next.push(clone);
  }

  return next;
}

function latestDate(series: RatePoint[]) {
  if (series.length === 0) return null;
  const last = series[series.length - 1];
  return last.date;
}

async function fetchJson(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Request failed (${response.status} ${response.statusText})`,
    );
  }
  return response.json();
}

async function fetchPrimary(maWindow: number): Promise<RateSeries> {
  const aaveUrl =
    process.env.AAVE_USDC_RATES_URL ??
    "https://yields.llama.fi/chart/aave?stablecoin=USDC";
  const crvUrl =
    process.env.CRVUSD_AVERAGE_RATES_URL ??
    "https://yields.llama.fi/chart/curve?stablecoin=crvusd";

  const [aavePayload, crvPayload] = await Promise.all([
    fetchJson(aaveUrl),
    fetchJson(crvUrl),
  ]);

  const aaveSeries = normaliseRemoteSeries(aavePayload);
  const crvSeries = normaliseRemoteSeries(crvPayload);
  const merged = mergeSeries(aaveSeries, crvSeries);
  const withMa = computeMovingAverage(merged, maWindow);
  const lastUpdated = latestDate(merged);

  return {
    series: withMa,
    maWindow,
    lastUpdated: lastUpdated
      ? new Date(`${lastUpdated}T00:00:00Z`).toISOString()
      : null,
    source: "primary",
    rangeHint: "daily",
  };
}

async function loadFallbackFromFile(
  fileName: string,
  maWindow: number,
): Promise<RateSeries | null> {
  const filePath = path.join(process.cwd(), fileName);
  let content: string;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch (_error) {
    return null;
  }

  const [aaveSeries, crvSeries] = normaliseCsvContent(content);
  const merged = mergeSeries(aaveSeries, crvSeries);
  const withMa = computeMovingAverage(merged, maWindow);
  const lastUpdated = latestDate(merged);

  return {
    series: withMa,
    maWindow,
    lastUpdated: lastUpdated
      ? new Date(`${lastUpdated}T00:00:00Z`).toISOString()
      : null,
    source: "fallback",
    rangeHint: "daily",
  };
}

function isStale(lastUpdated: string | null) {
  if (!lastUpdated) return true;
  const age = Date.now() - new Date(lastUpdated).getTime();
  return age > MAX_STALENESS_MS;
}

export async function loadRates(options?: {
  maWindow?: number;
  fallbackFile?: string;
}): Promise<RateSeries> {
  const maWindow = options?.maWindow ?? DEFAULT_MA_WINDOW;
  const fallbackFile = options?.fallbackFile ?? DEFAULT_FALLBACK_FILE;
  let primaryError: string | undefined;

  const fallback = await loadFallbackFromFile(fallbackFile, maWindow);
  if (fallback && fallback.series.length > 0) return fallback;

  // Only try primary API if no CSV is available.
  try {
    const primary = await fetchPrimary(maWindow);
    if (!isStale(primary.lastUpdated)) {
      return primary;
    }
    primaryError = "Primary data is stale (older than 24h)";
  } catch (error) {
    primaryError =
      error instanceof Error ? error.message : "Primary rate fetch failed";
  }

  return {
    series: [],
    maWindow,
    lastUpdated: null,
    source: "fallback",
    rangeHint: "daily",
    error: primaryError ?? "No data available",
  };
}

// Export internals for tests.
export const _internal = {
  normaliseRemoteSeries,
  normaliseCsvContent,
  mergeSeries,
  computeMovingAverage,
  isStale,
};
