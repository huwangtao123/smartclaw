import { promises as fs } from "node:fs";
import path from "node:path";

import type { Trader } from "./types";

export const FILTERED_DATA_FILE = "fx_leaderboard_filtered.csv";

function parseNumber(value: string | undefined) {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function parseCsv(content: string): Trader[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",");
  const indexOf = (column: string) => headers.indexOf(column);

  const rankIdx = indexOf("rank");
  const traderIdx = indexOf("trader");
  const roiIdx = indexOf("roi");
  const pnlIdx = indexOf("pnl");
  const pnlCleanIdx = indexOf("pnl_clean");
  const volIdx = indexOf("vol");
  const netIdx = indexOf("net");

  const rows: Trader[] = [];

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cells = line.split(",");
    const pick = (idx: number) =>
      idx >= 0 && idx < cells.length ? (cells[idx]?.trim() ?? "") : "";

    const rankValue = parseNumber(pick(rankIdx));
    const traderAddress = pick(traderIdx);

    if (!rankValue || !traderAddress) continue;

    const trader: Trader = {
      rank: rankValue,
      trader: traderAddress,
    };

    const roiValue = parseNumber(pick(roiIdx));
    const pnlValue = parseNumber(pick(pnlIdx));
    const pnlCleanValue = parseNumber(pick(pnlCleanIdx));
    const volValue = parseNumber(pick(volIdx));
    const netValue = parseNumber(pick(netIdx));

    if (roiValue !== undefined) trader.roi = roiValue;
    if (pnlValue !== undefined) trader.pnl = pnlValue;
    if (pnlCleanValue !== undefined) trader.pnlClean = pnlCleanValue;
    if (volValue !== undefined) trader.vol = volValue;
    if (netValue !== undefined) trader.net = netValue;

    rows.push(trader);
  }

  return rows;
}

export async function loadFilteredTraders(
  fileName: string = FILTERED_DATA_FILE,
): Promise<Trader[]> {
  const filePath = path.join(process.cwd(), fileName);
  let raw: string;

  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    console.error(`Unable to load ${fileName}`, error);
    return [];
  }

  return parseCsv(raw);
}

export function getPnl(row: Trader) {
  return row.pnlClean ?? row.pnl ?? 0;
}
