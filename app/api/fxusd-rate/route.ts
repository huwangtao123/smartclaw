import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Legacy redirect: /api/fxusd-rate → /api/fx/fxusd-rate
 * Preserved for backward compatibility.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const newUrl = new URL(`/api/fx/fxusd-rate${url.search}`, url.origin);
  return NextResponse.redirect(newUrl, 301);
}
