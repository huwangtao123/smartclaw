import { NextResponse } from "next/server";

import { getPnl, loadFilteredTraders } from "@/lib/data";
import { updateDashboardData } from "@/lib/updateData";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parseLimit(url: URL) {
    const raw = url.searchParams.get("limit");
    if (!raw) return DEFAULT_LIMIT;

    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
        return DEFAULT_LIMIT;
    }

    return Math.min(Math.floor(value), MAX_LIMIT);
}

export async function GET(request: Request) {
    try {
        await updateDashboardData();
        const traders = await loadFilteredTraders();
        const limit = parseLimit(new URL(request.url));

        const data = traders
            .slice()
            .sort((a, b) => getPnl(b) - getPnl(a))
            .slice(0, limit)
            .map((trader) => ({
                trader: trader.trader,
                roi: trader.roi ?? null,
                pnl: trader.pnl ?? null,
                pnlClean: trader.pnlClean ?? null,
                vol: trader.vol ?? null,
                net: trader.net ?? null,
            }));

        return NextResponse.json({
            data,
            meta: {
                protocol: "fx",
                limit,
                total: traders.length,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("Failed to serve /api/fx/top-pnl", error);
        return NextResponse.json(
            {
                error: "Failed to load top PNL data",
            },
            { status: 500 },
        );
    }
}
