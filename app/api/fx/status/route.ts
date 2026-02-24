import { NextResponse } from "next/server";

import { loadFilteredTraders } from "@/lib/data";
import { computeMetrics } from "@/lib/metrics";
import { updateDashboardData } from "@/lib/updateData";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await updateDashboardData();
        const traders = await loadFilteredTraders();
        const metrics = computeMetrics(traders);

        return NextResponse.json({
            protocol: "fx",
            trackedWallets: metrics.totalTraders,
            winners: metrics.winningCount,
            losers: metrics.losingCount,
            winRate: Math.round(metrics.winningRate * 10000) / 100,
            weightedWinRate: Math.round(metrics.weightedWinningRate * 10000) / 100,
            totalVolume: Math.round(metrics.totalVol * 100) / 100,
            totalPnl: Math.round(metrics.totalPnl * 100) / 100,
            avgRoi: Math.round(metrics.avgRoi * 100) / 100,
            netMomentumShare:
                Math.round(metrics.netMomentumShare * 10000) / 100,
            hasMajorityMomentum: metrics.hasMajorityMomentum,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Failed to serve /api/fx/status", error);
        return NextResponse.json(
            { error: "Failed to load f(x) Protocol status" },
            { status: 500 },
        );
    }
}
