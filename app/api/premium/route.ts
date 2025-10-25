import { NextResponse } from "next/server";

import { loadFilteredTraders } from "@/lib/data";
import { computeMetrics } from "@/lib/metrics";
import { updateDashboardData } from "@/lib/updateData";

export const dynamic = "force-dynamic";

export async function GET() {
  await updateDashboardData();
  const traders = await loadFilteredTraders();
  const metrics = computeMetrics(traders);

  return NextResponse.json({
    x402Version: 1,
    topByPnl: metrics.topByPnl,
    topByRoi: metrics.topByRoi,
    generatedAt: new Date().toISOString(),
  });
}
