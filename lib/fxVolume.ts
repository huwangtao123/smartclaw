const FX_VOLUME_ENDPOINT =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLhzkk8fyfNmX9htgSsO_8pchBFYVrzbpg6nCHSgJ1zxt_NrMSTwECsu8vzPdMynAWHBKWdOIO1lqqaPJ1_6B7W4oNNgaTfa8c8rxD97DJZ1yjwskOQ-SuNh_EqC0Y9ZSJrbDsesJNjuSwWIdtIU0Dehpax_2RxpHtrNFKbGeaULf-sMUfO6RuoRlMPHzQ74PXlo8UhnOJ5RLFjxIsHDqd8YzpOsdeoCfuKyQOT5QTZN4DyygGFpyekwGIqH02eUQLMdFtX34RM-_wMI6SlSDmlCI7-Ljg&lib=MB3zkXV6Nyguta8POznRSKPRmfl1MEKcW";

export type MetricId = "openLong" | "closeLong" | "openShort" | "closeShort";

export type MetricConfig = {
  id: MetricId;
  rawLabel: string;
  label: string;
  color: string;
};

export type DailyVolumeRecord = {
  date: string;
  metrics: Record<MetricId, number>;
};

export type TokenVolumeSeries = {
  token: string;
  data: DailyVolumeRecord[];
};

export type FxVolumeSnapshot = {
  lastTimestamp: string | null;
  tokens: TokenVolumeSeries[];
};

type RawVolumeRow = {
  Timestamp: string;
  Token: string;
  Metric_Type: string;
  Volume: number;
};

type FxVolumeApiResponse = {
  status: string;
  data?: RawVolumeRow[];
};

export const METRIC_CONFIGS: MetricConfig[] = [
  {
    id: "openLong",
    rawLabel: "🟢 Open xPosition",
    label: "Open xPosition (Long)",
    color: "#22c55e",
  },
  {
    id: "closeLong",
    rawLabel: "🔴 Close xPosition",
    label: "Close xPosition (Long)",
    color: "#f87171",
  },
  {
    id: "openShort",
    rawLabel: "🔴 Open sPosition",
    label: "Open sPosition (Short)",
    color: "#f97316",
  },
  {
    id: "closeShort",
    rawLabel: "🟢 Close sPosition",
    label: "Close sPosition (Short)",
    color: "#60a5fa",
  },
];

const RAW_LABEL_TO_ID = new Map(
  METRIC_CONFIGS.map((metric) => [metric.rawLabel, metric.id]),
);

function toUtcDateKey(timestamp: string) {
  const date = new Date(timestamp);
  // Format as YYYY-MM-DD to aggregate per UTC day.
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initialiseMetricRecord(): Record<MetricId, number> {
  return {
    openLong: 0,
    closeLong: 0,
    openShort: 0,
    closeShort: 0,
  };
}

export async function fetchFxVolumeSnapshot(): Promise<FxVolumeSnapshot> {
  const response = await fetch(FX_VOLUME_ENDPOINT, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch FX volume data (${response.status} ${response.statusText})`,
    );
  }

  const json = (await response.json()) as FxVolumeApiResponse;
  if (json.status !== "success" || !Array.isArray(json.data)) {
    throw new Error("FX volume endpoint returned unexpected payload");
  }

  const tokenDayMap = new Map<string, Map<string, Record<MetricId, number>>>();
  let latestTimestamp: string | null = null;

  for (const row of json.data) {
    const metricId = RAW_LABEL_TO_ID.get(row.Metric_Type);
    if (!metricId) continue;
    if (!Number.isFinite(row.Volume)) continue;

    const dateKey = toUtcDateKey(row.Timestamp);
    let tokenMap = tokenDayMap.get(row.Token);
    if (!tokenMap) {
      tokenMap = new Map<string, Record<MetricId, number>>();
      tokenDayMap.set(row.Token, tokenMap);
    }

    let metricRecord = tokenMap.get(dateKey);
    if (!metricRecord) {
      metricRecord = initialiseMetricRecord();
      tokenMap.set(dateKey, metricRecord);
    }

    metricRecord[metricId] += row.Volume;

    if (!latestTimestamp || row.Timestamp > latestTimestamp) {
      latestTimestamp = row.Timestamp;
    }
  }

  const tokens: TokenVolumeSeries[] = Array.from(tokenDayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([token, dayMap]) => {
      const data: DailyVolumeRecord[] = Array.from(dayMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, metrics]) => ({
          date,
          metrics,
        }));
      return { token, data };
    });

  return {
    lastTimestamp: latestTimestamp,
    tokens,
  };
}
