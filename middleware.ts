import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Address } from "viem";
import {
  type Network,
  paymentMiddleware,
  type Resource,
  type RoutesConfig,
} from "x402-next";

const payTo = process.env.RESOURCE_WALLET_ADDRESS as Address | undefined;
const rawNetwork = (process.env.X402_NETWORK ?? "base") as Network;
const facilitatorEnv = process.env.NEXT_PUBLIC_FACILITATOR_URL;
const cdpKeyId = process.env.CDP_API_KEY_ID;
const cdpKeySecret = process.env.CDP_API_KEY_SECRET;
const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
const premiumResource = siteUrl
  ? (`${siteUrl}/premium` as Resource)
  : undefined;
const premiumApiResource = siteUrl
  ? (`${siteUrl}/api/premium` as Resource)
  : undefined;

const facilitatorUrl =
  facilitatorEnv !== undefined
    ? (facilitatorEnv as Resource)
    : rawNetwork === "base"
      ? null
      : ("https://x402.org/facilitator" as Resource);

if (!payTo) {
  console.warn(
    "[x402] Missing RESOURCE_WALLET_ADDRESS environment variable. Premium gateways will respond with 500 until configured.",
  );
}

if (!facilitatorUrl) {
  console.warn(
    "[x402] NEXT_PUBLIC_FACILITATOR_URL is required when X402_NETWORK=base. Configure a mainnet facilitator that supports Base.",
  );
}

const routes: RoutesConfig = {
  "/premium": {
    price: "$1",
    network: rawNetwork,
    config: {
      description: "Access AliDashboard premium leaderboard insights",
      resource: premiumResource,
    },
  },
  "/api/premium": {
    price: "$1",
    network: rawNetwork,
    config: {
      description: "Access AliDashboard premium leaderboard API",
      mimeType: "application/json",
      discoverable: false,
      resource: premiumApiResource,
    },
  },
} as const;

const configuredMiddleware =
  payTo && facilitatorUrl
    ? paymentMiddleware(
        payTo,
        routes,
        {
          url: facilitatorUrl,
        },
        {
          appName: "AliDashboard Premium",
          appLogo: "/fx-protocol-icon.svg",
          ...(cdpKeyId && cdpKeySecret
            ? {
                sessionTokenEndpoint: "/api/x402/session-token",
              }
            : {}),
        },
      )
    : async (_request: NextRequest) =>
        new NextResponse(
          JSON.stringify({
            error: payTo
              ? "NEXT_PUBLIC_FACILITATOR_URL is not configured for the selected X402 network"
              : "RESOURCE_WALLET_ADDRESS is not configured",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );

export async function middleware(request: NextRequest) {
  const isPrefetch =
    request.headers.get("x-middleware-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch";

  if (isPrefetch || request.method === "HEAD" || request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const response = await configuredMiddleware(request);

  if (
    response.status === 402 &&
    response.headers.get("content-type")?.includes("application/json")
  ) {
    try {
      const payload = await response.clone().json();
      const forwardedHost =
        request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
      const forwardedProto =
        request.headers.get("x-forwarded-proto") ??
        request.nextUrl.protocol.replace(":", "");
      const baseUrl = siteUrl ?? `${forwardedProto}://${forwardedHost}`;
      const computedResource =
        `${baseUrl}${request.nextUrl.pathname}` as Resource;
      console.info("[middleware] original accepts", payload?.accepts);
      const updated = {
        ...payload,
        accepts: Array.isArray(payload?.accepts)
          ? payload.accepts.map((item: Record<string, unknown>) =>
              item && typeof item === "object"
                ? {
                    ...item,
                    resource: computedResource,
                  }
                : item,
            )
          : payload?.accepts,
      };

      const headers = new Headers(response.headers);
      headers.set("content-type", "application/json");
      console.info("[middleware] rewritten resource", computedResource);
      return new NextResponse(JSON.stringify(updated), {
        status: response.status,
        headers,
      });
    } catch (error) {
      console.error("[middleware] Unable to normalize resource URL", error);
    }
  }

  if (
    response.status === 402 &&
    response.headers.get("content-type")?.includes("text/html")
  ) {
    const forwardedHost =
      request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
    const forwardedProto =
      request.headers.get("x-forwarded-proto") ??
      request.nextUrl.protocol.replace(":", "");
    const baseUrl = siteUrl ?? `${forwardedProto}://${forwardedHost}`;
    const currentPath = request.nextUrl.pathname;
    const normalizedResource = `${baseUrl}${currentPath}`;

    try {
      const html = await response.clone().text();
      const updatedHtml = html
        .replace(/currentUrl:\s*"[^"]*"/, `currentUrl: "${normalizedResource}"`)
        .replace(/"resource":"[^"]+"/g, `"resource":"${normalizedResource}"`);

      const headers = new Headers(response.headers);
      headers.set("content-type", "text/html; charset=utf-8");
      console.info("[middleware] rewritten html resource", normalizedResource);
      return new NextResponse(updatedHtml, {
        status: response.status,
        headers,
      });
    } catch (error) {
      console.error("[middleware] Unable to rewrite paywall HTML", error);
    }
  }

  return response;
}

export const config = {
  matcher: ["/premium/:path*", "/api/premium/:path*"],
};
