import { NextResponse } from "next/server";

import { buildOpenApiDocument } from "@/lib/openapi";

export async function GET() {
  const document = buildOpenApiDocument();
  return NextResponse.json(document);
}
