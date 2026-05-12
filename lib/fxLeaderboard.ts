import type { Trader } from "@/lib/types";

const FX_LEADERBOARD_ENDPOINT =
  "https://fx.aladdin.club/LEADERBOARD_HOST/Rank/";

const FX_LEADERBOARD_HEADERS = {
  "Content-Type": "application/json",
  Origin: "https://fx.aladdin.club",
  Referer: "https://fx.aladdin.club/v2/leaderboard/",
} as const;

type LeaderboardMetric = "vol" | "pnl" | "roi" | "net";
type LeaderboardPeriod = "1D" | "7D" | "30D" | "all";

export type FxLeaderboardSnapshot = {
  period: LeaderboardPeriod;
  topByVolume: Trader[];
  topByPnl: Trader[];
};

function parseNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const cleaned = value
      .trim()
      .replace(/,/g, "")
      .replace(/[^0-9+\-eE.]/g, "");
    if (!cleaned) return undefined;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function findRows(payload: unknown, depth = 0): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object" || depth > 5) return [];

  const object = payload as Record<string, unknown>;
  if (Array.isArray(object.ranklist)) return object.ranklist;
  for (const key of ["data", "result", "rows"]) {
    const rows = findRows(object[key], depth + 1);
    if (rows.length > 0) return rows;
  }
  return [];
}

function normalizeTrader(row: unknown): Trader | null {
  if (!row || typeof row !== "object") return null;
  const object = row as Record<string, unknown>;
  const trader = typeof object.trader === "string" ? object.trader : null;
  if (!trader) return null;

  return {
    rank: parseNumber(object.rank) ?? 0,
    trader,
    roi: parseNumber(object.roi),
    pnl: parseNumber(object.pnl),
    pnlClean: parseNumber(object.pnl),
    vol: parseNumber(object.vol),
    net: parseNumber(object.net),
  };
}

async function fetchLeaderboard(
  metric: LeaderboardMetric,
  period: LeaderboardPeriod,
) {
  const response = await fetch(FX_LEADERBOARD_ENDPOINT, {
    method: "POST",
    headers: FX_LEADERBOARD_HEADERS,
    cache: "no-store",
    body: JSON.stringify({
      metric,
      period,
      reverse: false,
      limit: 10,
      offset: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch f(x) ${period} ${metric} leaderboard (${response.status})`,
    );
  }

  const payload = await response.json();
  return findRows(payload)
    .map(normalizeTrader)
    .filter((row): row is Trader => !!row);
}

export async function fetchFxLeaderboardSnapshot(
  period: LeaderboardPeriod = "7D",
): Promise<FxLeaderboardSnapshot> {
  const [topByVolume, topByPnl] = await Promise.all([
    fetchLeaderboard("vol", period),
    fetchLeaderboard("pnl", period),
  ]);

  return {
    period,
    topByVolume,
    topByPnl,
  };
}
