import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    const dataFile = path.join(process.cwd(), "public", "solana_data.json");
    const fileContents = await fs.readFile(dataFile, "utf8");
    const solanaData = JSON.parse(fileContents);
    
    // The Watchlist is just the top tokens identified by our Dexscraper script
    const watchlist = solanaData.watchlist || [];
    return NextResponse.json(watchlist.slice(0, limit));

  } catch (error) {
    console.error("Failed to read solana data:", error);
    return NextResponse.json({ error: "Data unavailable" }, { status: 500 });
  }
}
