import { NextResponse } from "next/server";

import { loadRates } from "@/lib/rates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const maParam = url.searchParams.get("maWindow");
  const maWindow = maParam ? Number(maParam) : undefined;

  const fallbackFile =
    url.searchParams.get("fallback") ??
    process.env.RATES_FALLBACK_FILE ??
    undefined;

  try {
    const data = await loadRates({
      maWindow: Number.isFinite(maWindow) ? maWindow : undefined,
      fallbackFile: fallbackFile ?? undefined,
    });

    if (data.series.length === 0) {
      return NextResponse.json(
        { error: data.error ?? "No rate data available" },
        { status: 503 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to serve /api/rates", error);
    return NextResponse.json(
      { error: "Failed to load lending rates" },
      { status: 500 },
    );
  }
}
