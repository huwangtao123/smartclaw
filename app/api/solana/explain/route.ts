import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject") || "wallet";
  const id = searchParams.get("id") || "unknown";
  
  return NextResponse.json({
    subject,
    id,
    explanation: `The ${subject} ${id} shows strong conviction due to early entry patterns and resistance to selling during local drawdowns. A cluster of smart wallets have co-invested in this entity.`,
    agentActionable: true,
  });
}
