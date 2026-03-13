import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const dataFile = path.join(process.cwd(), "public", "solana_data.json");
    const fileContents = await fs.readFile(dataFile, "utf8");
    const solanaData = JSON.parse(fileContents);
    return NextResponse.json(solanaData.overview || {});
  } catch (error) {
    console.error("Failed to read solana data:", error);
    return NextResponse.json({ error: "Data unavailable" }, { status: 500 });
  }
}
