import { promises as fs } from "node:fs";
import path from "node:path";

type CsvValue = string | number | boolean | null | undefined;

type NormalizedRow = {
  csv: Record<string, CsvValue>;
  volClean?: number;
  hadVolValue: boolean;
};

const API_URL = "https://fx.aladdin.club/LEADERBOARD_HOST/Rank/";
const API_HEADERS = {
  "Content-Type": "application/json",
  Origin: "https://fx.aladdin.club",
  Referer: "https://fx.aladdin.club/v2/leaderboard/",
} as const;

const API_PAYLOAD = {
  metric: "roi",
  period: "all",
  reverse: false,
  limit: 5000,
  offset: 0,
} as const;

const FULL_DATA_FILE = "fx_leaderboard_full.csv";
const FILTERED_DATA_FILE = "fx_leaderboard_filtered.csv";
const MIN_VOLUME = Number(process.env.DASHBOARD_MIN_VOLUME ?? 10);

const CACHE_TTL_MS = (() => {
  const raw = process.env.DASHBOARD_DATA_TTL_MS;
  if (!raw) return 5 * 60 * 1000;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
})();

let inflight: Promise<void> | null = null;
let lastSuccessfulRun = 0;

export async function updateDashboardData() {
  if (process.env.SKIP_DASHBOARD_REFRESH === "1") {
    return;
  }

  if (inflight) {
    await inflight;
    return;
  }

  const now = Date.now();
  if (CACHE_TTL_MS > 0 && now - lastSuccessfulRun < CACHE_TTL_MS) {
    return;
  }

  inflight = refreshLeaderboardData()
    .then(() => {
      lastSuccessfulRun = Date.now();
    })
    .catch((error) => {
      console.error("[dashboardAPI] Unable to refresh leaderboard data", error);
    })
    .finally(() => {
      inflight = null;
    });

  await inflight;
}

async function refreshLeaderboardData() {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify(API_PAYLOAD),
  });

  console.log(`[dashboardAPI] Status: ${response.status}`);

  if (!response.ok) {
    const message = await safeReadResponseText(response);
    throw new Error(`Request failed: ${message || response.statusText}`);
  }

  const payload = await response.json();
  const rows = extractRows(payload);

  if (!rows.length) {
    console.warn(
      "[dashboardAPI] Response contained no rows – skipping file refresh",
    );
    return;
  }

  const processed = rows
    .filter(
      (row): row is Record<string, unknown> => !!row && typeof row === "object",
    )
    .map(normalizeRow);

  const filtered = processed.filter(
    (entry) =>
      typeof entry.volClean === "number" && entry.volClean > MIN_VOLUME,
  );

  const missingVol = processed.filter(
    (entry) => entry.hadVolValue && typeof entry.volClean !== "number",
  ).length;

  console.log(`[dashboardAPI] ✅ Loaded ${processed.length} total records`);
  console.log(
    `[dashboardAPI] Filtered records (Volume > ${MIN_VOLUME}): ${filtered.length}`,
  );

  if (missingVol) {
    console.warn(
      `[dashboardAPI warning] Skipped ${missingVol} rows with non-numeric Volume values.`,
    );
  }

  const preferredOrder = [
    "rank",
    "trader",
    "roi",
    "pnl",
    "pnl_clean",
    "vol",
    "vol_clean",
    "net",
  ];

  const fullRows = processed.map((entry) => entry.csv);
  const filteredRows = filtered.map((entry) => entry.csv);

  const { csv: fullCsv, headers } = buildCsv(fullRows, preferredOrder);
  const { csv: filteredCsv } = buildCsv(filteredRows, preferredOrder, headers);

  const cwd = process.cwd();
  await Promise.all([
    fs.writeFile(path.join(cwd, FULL_DATA_FILE), fullCsv, "utf8"),
    fs.writeFile(path.join(cwd, FILTERED_DATA_FILE), filteredCsv, "utf8"),
  ]);

  console.log("[dashboardAPI] 📊 Files saved:");
  console.log(` - ${FULL_DATA_FILE}`);
  console.log(` - ${FILTERED_DATA_FILE}`);
}

function normalizeRow(row: Record<string, unknown>): NormalizedRow {
  const csvRow: Record<string, CsvValue> = {};

  for (const [key, value] of Object.entries(row)) {
    csvRow[key] = sanitizeValue(value);
  }

  const volClean = parseNumeric(row.vol);
  const pnlClean = parseNumeric(row.pnl);

  if (!("vol_clean" in csvRow)) {
    csvRow.vol_clean = volClean ?? "";
  }
  if (!("pnl_clean" in csvRow)) {
    csvRow.pnl_clean = pnlClean ?? "";
  }

  return {
    csv: csvRow,
    volClean,
    hadVolValue: row.vol !== undefined && row.vol !== null,
  };
}

function sanitizeValue(value: unknown): CsvValue {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return JSON.stringify(value);
}

function parseNumeric(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const cleaned = trimmed.replace(/,/g, "").replace(/[^0-9+\-eE.]/g, "");

    if (!cleaned) return undefined;

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

async function safeReadResponseText(response: Response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function extractRows(payload: unknown): unknown[] {
  const rows = findRows(payload);
  if (!rows) {
    throw new Error("Leaderboard response did not include a row list");
  }
  return rows;
}

function findRows(payload: unknown, depth = 0): unknown[] | null {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object" || depth > 5) {
    return null;
  }

  const candidate = payload as Record<string, unknown>;

  if (Array.isArray(candidate.ranklist)) {
    return candidate.ranklist as unknown[];
  }

  const keys = ["data", "result", "rows", "payload"];

  for (const key of keys) {
    if (key in candidate) {
      const nested = findRows(candidate[key], depth + 1);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

function buildCsv(
  rows: Record<string, CsvValue>[],
  preferredOrder: string[],
  existingHeaders?: string[],
) {
  const headerSet = new Set<string>(existingHeaders ?? []);

  for (const column of preferredOrder) {
    headerSet.add(column);
  }

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      headerSet.add(key);
    }
  }

  const headers = sortHeaders(Array.from(headerSet), preferredOrder);
  const lines = [headers.join(",")];

  for (const row of rows) {
    const line = headers.map((key) => formatCsvValue(row[key])).join(",");
    lines.push(line);
  }

  if (lines.length === 1) {
    lines.push("");
  }

  return {
    csv: `${lines.join("\n")}\n`,
    headers,
  };
}

function sortHeaders(headers: string[], preferredOrder: string[]) {
  return headers.sort((a, b) => {
    const aIdx = preferredOrder.indexOf(a);
    const bIdx = preferredOrder.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });
}

function formatCsvValue(value: CsvValue) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const raw = typeof value === "string" ? value : String(value);
  const needsEscaping = /[",\n\r]/.test(raw);
  const escaped = raw.replace(/"/g, '""');
  return needsEscaping ? `"${escaped}"` : escaped;
}
