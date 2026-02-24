import { NextResponse } from "next/server";
import { loadRates } from "@/lib/rates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const maParam = url.searchParams.get("maWindow");
    const maWindow = maParam ? Number(maParam) : undefined;

    const limitParam =
        url.searchParams.get("limit") ?? url.searchParams.get("window");
    const limit = limitParam ? Number(limitParam) : undefined;

    try {
        const data = await loadRates({
            maWindow: Number.isFinite(maWindow) ? maWindow : undefined,
        });

        if (data.series.length === 0) {
            return NextResponse.json(
                { error: data.error ?? "No rate data available" },
                { status: 503 },
            );
        }

        // Filter and format the data specifically for fxUSD
        let fxusdSeries = data.series.map((point) => ({
            date: point.date,
            rate: point.fxusdBorrow,
        }));

        if (typeof limit === "number" && Number.isFinite(limit) && limit > 0) {
            fxusdSeries = fxusdSeries.slice(-limit);
        }

        // Sort by latest first
        fxusdSeries.reverse();

        const latestPoint = data.series[data.series.length - 1];

        return NextResponse.json({
            latest: {
                date: latestPoint.date,
                rate: latestPoint.fxusdBorrow,
            },
            series: fxusdSeries,
            meta: {
                protocol: "fx",
                maWindow: data.maWindow,
                lastUpdated: data.lastUpdated,
                source: data.source,
            },
        });
    } catch (error) {
        console.error("Failed to serve /api/fx/fxusd-rate", error);
        return NextResponse.json(
            { error: "Failed to load fxUSD rates" },
            { status: 500 },
        );
    }
}
