import { METRIC_CONFIGS, type MetricId } from "@/lib/fxVolume";

const FX_ACTIVITY_ENDPOINT =
  process.env.FX_ACTIVITY_ENDPOINT ??
  "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnTSfQlGnmk1ZaGdPbxmI0YB0lOAJE2IcNoRsGSxoLAHI90KSGe8EpZf6keTf39hkEpita0lkrrk5DzSwtRWnUvOK_v6fJ4PaekG0rglsmOPOb1h6kuwA7Y0V1BHbBAR1RSmqRF9g85rO5F4cCsfgZvY67rfYXe5EjE9FEx6XzYY621x2qdBfCJCZet6Nwu1qDjXa-EFTNrmS6xgPJbeselWIVLIYB7RxmmKW7bk2cNK1pR0IuTAw6J_O4O30EB4a5x3K4mCrx7lY9kaGwDpIr7LZNJQcg&lib=MB3zkXV6Nyguta8POznRSKPRmfl1MEKcW";

const DEFAULT_ACTIVITY_TIMEOUT_MS = 10_000;
const DEFAULT_ACTIVITY_CACHE_TTL_MS = 5 * 60 * 1000;

const FX_ACTIVITY_TIMEOUT_MS = readPositiveIntegerEnv(
  "FX_ACTIVITY_TIMEOUT_MS",
  DEFAULT_ACTIVITY_TIMEOUT_MS,
);
const FX_ACTIVITY_CACHE_TTL_MS = readPositiveIntegerEnv(
  "FX_ACTIVITY_CACHE_TTL_MS",
  DEFAULT_ACTIVITY_CACHE_TTL_MS,
);

type RawActivityRow = {
  Timestamp: string;
  Token: string;
  Metric_Type: string;
  Metric_Name?: string;
  Volume: number | string;
  Period_Hours?: number | string;
  Transaction_Count?: number | string;
  Tx_Hash?: string;
  Transaction_Hash?: string;
  TransactionHash?: string;
  TxHash?: string;
  Hash?: string;
};

type FxActivityApiResponse = {
  status: string;
  data?: RawActivityRow[];
};

export type FxActivityEntry = {
  timestamp: string;
  date: string;
  token: string;
  metricId: MetricId;
  metricLabel: string;
  metricName: string | null;
  volume: number;
  periodHours: number | null;
  transactionCount: number | null;
  txHash: string | null;
};

export type FxActivitySummary = Record<MetricId, number> & {
  totalVolume: number;
  netLong: number;
  netShort: number;
};

export type FxActivityPeriodSnapshot = {
  key: "daily" | "weekly" | "monthly";
  label: string;
  current: FxActivitySummary;
  previous: FxActivitySummary;
};

export type FxActivityTokenSnapshot = {
  token: string;
  totalVolume: number;
  periods: FxActivityPeriodSnapshot[];
  activity: FxActivityEntry[];
};

export type FxActivitySnapshot = {
  lastTimestamp: string | null;
  activity: FxActivityEntry[];
  overview: {
    tokenCount: number;
  };
  tokens: FxActivityTokenSnapshot[];
};

const RAW_LABEL_TO_ID = new Map(
  METRIC_CONFIGS.map((metric) => [metric.rawLabel, metric.id]),
);

const PERIOD_CONFIGS: Array<{
  key: FxActivityPeriodSnapshot["key"];
  label: string;
  durationMs: number;
}> = [
  { key: "daily", label: "24H", durationMs: 24 * 60 * 60 * 1000 },
  { key: "weekly", label: "7D", durationMs: 7 * 24 * 60 * 60 * 1000 },
  { key: "monthly", label: "30D", durationMs: 30 * 24 * 60 * 60 * 1000 },
];

let cachedSnapshot: FxActivitySnapshot | null = null;
let cachedSnapshotAt = 0;
let inFlightSnapshot: Promise<FxActivitySnapshot> | null = null;

function readPositiveIntegerEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function toUtcDateKey(timestamp: string) {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toFiniteNumber(value: unknown) {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(numeric) ? numeric : null;
}

function toTxHash(row: RawActivityRow) {
  const candidate =
    row.Tx_Hash ??
    row.Transaction_Hash ??
    row.TransactionHash ??
    row.TxHash ??
    row.Hash;
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  return /^0x[a-fA-F0-9]{64}$/.test(trimmed) ? trimmed : null;
}

function buildEmptySummary(): FxActivitySummary {
  return {
    openLong: 0,
    closeLong: 0,
    openShort: 0,
    closeShort: 0,
    totalVolume: 0,
    netLong: 0,
    netShort: 0,
  };
}

function summariseActivity(entries: FxActivityEntry[]): FxActivitySummary {
  const summary = buildEmptySummary();

  for (const entry of entries) {
    summary[entry.metricId] += entry.volume;
    summary.totalVolume += entry.volume;
  }

  summary.netLong = summary.openLong - summary.closeLong;
  summary.netShort = summary.openShort - summary.closeShort;
  return summary;
}

function buildPeriodSnapshot(
  entries: FxActivityEntry[],
  latestTimestampMs: number | null,
  period: (typeof PERIOD_CONFIGS)[number],
): FxActivityPeriodSnapshot {
  if (latestTimestampMs === null) {
    return {
      key: period.key,
      label: period.label,
      current: buildEmptySummary(),
      previous: buildEmptySummary(),
    };
  }

  const currentStart = latestTimestampMs - period.durationMs;
  const previousStart = currentStart - period.durationMs;

  const currentEntries: FxActivityEntry[] = [];
  const previousEntries: FxActivityEntry[] = [];

  for (const entry of entries) {
    const entryTime = Date.parse(entry.timestamp);
    if (!Number.isFinite(entryTime)) continue;

    if (entryTime > currentStart && entryTime <= latestTimestampMs) {
      currentEntries.push(entry);
      continue;
    }

    if (entryTime > previousStart && entryTime <= currentStart) {
      previousEntries.push(entry);
    }
  }

  return {
    key: period.key,
    label: period.label,
    current: summariseActivity(currentEntries),
    previous: summariseActivity(previousEntries),
  };
}

async function fetchFxActivitySnapshotFresh(): Promise<FxActivitySnapshot> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FX_ACTIVITY_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(FX_ACTIVITY_ENDPOINT, {
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch FX activity data (${response.status} ${response.statusText})`,
    );
  }

  const json = (await response.json()) as FxActivityApiResponse;
  if (json.status !== "success" || !Array.isArray(json.data)) {
    throw new Error("FX activity endpoint returned unexpected payload");
  }

  const activity: FxActivityEntry[] = [];
  let latestTimestampMs: number | null = null;
  let lastTimestamp: string | null = null;

  for (const row of json.data) {
    const metricId = RAW_LABEL_TO_ID.get(row.Metric_Type);
    if (!metricId) continue;

    const volume = toFiniteNumber(row.Volume);
    if (volume === null) continue;

    const timestampMs = Date.parse(row.Timestamp);
    if (!Number.isFinite(timestampMs)) continue;

    const entry: FxActivityEntry = {
      timestamp: row.Timestamp,
      date: toUtcDateKey(row.Timestamp),
      token: row.Token,
      metricId,
      metricLabel: row.Metric_Type,
      metricName:
        typeof row.Metric_Name === "string" && row.Metric_Name.trim().length > 0
          ? row.Metric_Name
          : null,
      volume,
      periodHours: toFiniteNumber(row.Period_Hours),
      transactionCount: toFiniteNumber(row.Transaction_Count),
      txHash: toTxHash(row),
    };
    activity.push(entry);

    if (latestTimestampMs === null || timestampMs > latestTimestampMs) {
      latestTimestampMs = timestampMs;
      lastTimestamp = row.Timestamp;
    }
  }

  activity.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  const tokenMap = new Map<string, FxActivityEntry[]>();
  for (const entry of activity) {
    const entries = tokenMap.get(entry.token);
    if (entries) {
      entries.push(entry);
    } else {
      tokenMap.set(entry.token, [entry]);
    }
  }

  const tokens: FxActivityTokenSnapshot[] = Array.from(tokenMap.entries())
    .map(([token, entries]) => ({
      token,
      totalVolume: entries.reduce((sum, entry) => sum + entry.volume, 0),
      periods: PERIOD_CONFIGS.map((period) =>
        buildPeriodSnapshot(entries, latestTimestampMs, period),
      ),
      activity: entries,
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume);

  return {
    lastTimestamp,
    activity,
    overview: {
      tokenCount: tokens.length,
    },
    tokens,
  };
}

export async function fetchFxActivitySnapshot(): Promise<FxActivitySnapshot> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedSnapshotAt < FX_ACTIVITY_CACHE_TTL_MS) {
    return cachedSnapshot;
  }

  if (inFlightSnapshot) {
    return inFlightSnapshot;
  }

  const request = fetchFxActivitySnapshotFresh()
    .then((snapshot) => {
      cachedSnapshot = snapshot;
      cachedSnapshotAt = Date.now();
      return snapshot;
    })
    .finally(() => {
      if (inFlightSnapshot === request) {
        inFlightSnapshot = null;
      }
    });

  inFlightSnapshot = request;
  return request;
}
