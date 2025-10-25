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
    },
  },
  "/api/premium": {
    price: "$1",
    network: rawNetwork,
    config: {
      description: "Access AliDashboard premium leaderboard API",
      mimeType: "application/json",
      discoverable: false,
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

export const middleware = configuredMiddleware;

export const config = {
  matcher: ["/premium/:path*", "/api/premium/:path*"],
};
