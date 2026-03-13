import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolOrMint = searchParams.get("symbolOrMint");

  try {
    const dataFile = path.join(process.cwd(), "public", "solana_data.json");
    const fileContents = await fs.readFile(dataFile, "utf8");
    const solanaData = JSON.parse(fileContents);
    
    let tokens = solanaData.tokenFlow || [];
    
    if (symbolOrMint) {
      tokens = tokens.filter((t: any) => 
        t.target.toLowerCase() === symbolOrMint.toLowerCase() || 
        t.mint === symbolOrMint
      );
    }
    
    return NextResponse.json(tokens);
  } catch (error) {
    console.error("Failed to read solana data:", error);
    return NextResponse.json({ error: "Data unavailable" }, { status: 500 });
  }
}
