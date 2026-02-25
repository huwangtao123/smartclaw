import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Address } from "viem";
import { paymentProxy, x402ResourceServer } from "@x402/next";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { createPaywall, evmPaywall } from "@x402/paywall";

const payTo = process.env.RESOURCE_WALLET_ADDRESS as Address | undefined;
const rawNetwork = process.env.X402_NETWORK ?? "base";
const facilitatorEnv = process.env.NEXT_PUBLIC_FACILITATOR_URL;
const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
const premiumAccessSecret = process.env.PREMIUM_ACCESS_SECRET;
const premiumAccessCookieName = "aicharts-premium-access";
const defaultPremiumAccessDurationHours = 72;
const rawPremiumAccessDuration =
  process.env.PREMIUM_ACCESS_DURATION_HOURS ?? "";
const parsedPremiumAccessDuration = Number.parseInt(
  rawPremiumAccessDuration,
  10,
);
const premiumAccessDurationHours =
  Number.isFinite(parsedPremiumAccessDuration) &&
    parsedPremiumAccessDuration > 0
    ? parsedPremiumAccessDuration
    : defaultPremiumAccessDurationHours;
const premiumAccessDurationMs = premiumAccessDurationHours * 60 * 60 * 1000;
const premiumAccessEncoder = new TextEncoder();
const premiumAccessDecoder = new TextDecoder();
const subtleCrypto = globalThis.crypto?.subtle;
let cachedHmacKey: CryptoKey | undefined;
let cachedHmacSecret: string | undefined;
let loggedMissingCrypto = false;

if (
  rawPremiumAccessDuration &&
  (!Number.isFinite(parsedPremiumAccessDuration) ||
    parsedPremiumAccessDuration <= 0)
) {
  console.warn(
    `[premium-access] PREMIUM_ACCESS_DURATION_HOURS must be a positive integer. Falling back to default of ${defaultPremiumAccessDurationHours} hours.`,
  );
}

if (!premiumAccessSecret) {
  console.warn(
    "[premium-access] Missing PREMIUM_ACCESS_SECRET. Premium access cookies cannot be issued until this is configured.",
  );
}

/* ═══════ Premium access cookie helpers (unchanged) ═══════ */

async function importPremiumAccessKey(secret: string) {
  if (!subtleCrypto) {
    if (!loggedMissingCrypto) {
      console.error(
        "[premium-access] Web Crypto API is unavailable. Unable to sign premium access cookies.",
      );
      loggedMissingCrypto = true;
    }
    return undefined;
  }

  if (cachedHmacKey && cachedHmacSecret === secret) {
    return cachedHmacKey;
  }

  try {
    cachedHmacKey = await subtleCrypto.importKey(
      "raw",
      premiumAccessEncoder.encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign", "verify"],
    );
    cachedHmacSecret = secret;
    return cachedHmacKey;
  } catch (error) {
    console.error("[premium-access] Failed to import HMAC key", error);
    return undefined;
  }
}

function encodeBase64Url(data: Uint8Array) {
  let binary = "";
  for (let index = 0; index < data.length; index += 1) {
    binary += String.fromCharCode(data[index]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(str: string) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

type PremiumAccessCookiePayload = {
  issuedAt: string;
  expiresAt: string;
};

async function signPremiumAccessPayload(serialized: string) {
  if (!premiumAccessSecret) return undefined;
  const key = await importPremiumAccessKey(premiumAccessSecret);
  if (!key || !subtleCrypto) return undefined;
  const signature = await subtleCrypto.sign(
    "HMAC",
    key,
    premiumAccessEncoder.encode(serialized),
  );
  return encodeBase64Url(new Uint8Array(signature));
}

async function verifyPremiumAccessPayload(
  serialized: string,
  signature: string,
) {
  if (!premiumAccessSecret) return false;
  const key = await importPremiumAccessKey(premiumAccessSecret);
  if (!key || !subtleCrypto) return false;
  try {
    return subtleCrypto.verify(
      "HMAC",
      key,
      decodeBase64Url(signature),
      premiumAccessEncoder.encode(serialized),
    );
  } catch {
    return false;
  }
}

async function createPremiumAccessCookie(expiresAt: Date) {
  const payload: PremiumAccessCookiePayload = {
    issuedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  const serialized = JSON.stringify(payload);
  const signature = await signPremiumAccessPayload(serialized);
  if (!signature) return undefined;
  const encodedPayload = encodeBase64Url(
    premiumAccessEncoder.encode(serialized),
  );
  return `${encodedPayload}.${signature}`;
}

type PremiumAccessCookieValidation =
  | { valid: true; expiresAt: Date }
  | { valid: false; reason: string; expiresAt?: Date };

async function readPremiumAccessCookie(
  cookieValue: string | undefined,
): Promise<PremiumAccessCookieValidation> {
  if (!cookieValue || !premiumAccessSecret) {
    return { valid: false, reason: "missing" };
  }

  const parts = cookieValue.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "format" };
  }

  let serialized: string;
  try {
    serialized = premiumAccessDecoder.decode(decodeBase64Url(parts[0]));
  } catch (error) {
    console.warn("[premium-access] Failed to decode cookie payload", error);
    return { valid: false, reason: "decode" };
  }

  const isValidSignature = await verifyPremiumAccessPayload(
    serialized,
    parts[1],
  );
  if (!isValidSignature) {
    return { valid: false, reason: "signature" };
  }

  let parsed: PremiumAccessCookiePayload;
  try {
    parsed = JSON.parse(serialized) as PremiumAccessCookiePayload;
  } catch (error) {
    console.warn("[premium-access] Invalid cookie JSON payload", error);
    return { valid: false, reason: "json" };
  }

  const expiresAt = new Date(parsed.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return { valid: false, reason: "invalid-expiry" };
  }
  if (Date.now() >= expiresAt.getTime()) {
    return { valid: false, reason: "expired", expiresAt };
  }

  return { valid: true, expiresAt };
}

/* ═══════ x402 v2 setup ═══════ */

// Map legacy network names to CAIP-2
const networkCaip2 = (rawNetwork === "base"
  ? "eip155:8453"
  : rawNetwork === "base-sepolia"
    ? "eip155:84532"
    : rawNetwork) as `${string}:${string}`;

const facilitatorUrl =
  facilitatorEnv !== undefined
    ? facilitatorEnv
    : rawNetwork === "base"
      ? null
      : "https://facilitator.heurist.xyz";

if (rawNetwork === "base" && !facilitatorEnv) {
  console.warn(
    "[x402] NEXT_PUBLIC_FACILITATOR_URL is required when X402_NETWORK=base. Configure a mainnet facilitator that supports Base.",
  );
}

// fxUSD token config — single source of truth for pricing
const FXUSD_ADDRESS = "0x55380fe7A1910dFf29A47B622057ab4139DA42C5";
const FXUSD_DECIMALS = 18;
const FXUSD_PRICE = 0.01; // dollar amount per premium API call

// Build the payment accepts array (fxUSD only)
const premiumAccepts = payTo
  ? [
    {
      scheme: "exact" as const,
      price: `$${FXUSD_PRICE}`,
      network: networkCaip2,
      payTo,
    },
  ]
  : [];

// Create the x402 resource server with fxUSD custom money parser
const fxusdScheme = new ExactEvmScheme();
// Register fxUSD parser: convert dollar amount to fxUSD token atomics
fxusdScheme.registerMoneyParser(async (amount: number, _network) => {
  if (Math.abs(amount - FXUSD_PRICE) < 0.0001) {
    const atomicAmount = BigInt(Math.round(amount * 10 ** FXUSD_DECIMALS)).toString();
    return {
      amount: atomicAmount,
      asset: FXUSD_ADDRESS,
      extra: { name: "FxUSD", version: "2" },
    };
  }
  return null; // amount doesn't match fxUSD price
});

const facilitatorClient = facilitatorUrl
  ? new HTTPFacilitatorClient({ url: facilitatorUrl })
  : null;

const resourceServer = facilitatorClient
  ? new x402ResourceServer(facilitatorClient)
    .register(networkCaip2, fxusdScheme)
  : null;

// Build the paywall with EVM wallet connection UI.
// Wrap evmPaywall to fix amount display for fxUSD (18-decimal tokens).
// The upstream evmPaywall.generateHtml hardcodes `amount / 1e6` (USDC decimals),
// so we convert 18-decimal atomic amounts to 6-decimal equivalents before display.
const fixedEvmPaywall = {
  supports: evmPaywall.supports.bind(evmPaywall),
  generateHtml(
    requirement: Parameters<typeof evmPaywall.generateHtml>[0],
    paymentRequired: Parameters<typeof evmPaywall.generateHtml>[1],
    config: Parameters<typeof evmPaywall.generateHtml>[2],
  ) {
    const asset = (requirement as { asset?: string }).asset;
    if (asset && asset.toLowerCase() === FXUSD_ADDRESS.toLowerCase()) {
      // Convert 18-decimal atomic amount to 6-decimal equivalent
      // so the paywall's hardcoded /1e6 shows the correct dollar value
      const fixedReq = {
        ...requirement,
        amount: requirement.amount
          ? String(
            Number(BigInt(requirement.amount) / BigInt(10 ** (FXUSD_DECIMALS - 6))),
          )
          : requirement.amount,
        ...(requirement.maxAmountRequired
          ? {
            maxAmountRequired: String(
              Number(
                BigInt(requirement.maxAmountRequired) /
                BigInt(10 ** (FXUSD_DECIMALS - 6)),
              ),
            ),
          }
          : {}),
      };
      // Generate the HTML, then patch the hardcoded USDC references:
      // 1. Replace USDC contract addresses with fxUSD so balance checks + payments use fxUSD
      // 2. Fix balance display: formatUnits(balance, 6) → formatUnits(balance, 18) 
      // 3. Replace display name "USDC" → "fxUSD"
      const USDC_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
      const USDC_TESTNET = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
      const USDC_ETH_L1 = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
      const html = evmPaywall.generateHtml(fixedReq as typeof requirement, paymentRequired, config);
      return html
        .replaceAll(USDC_MAINNET, FXUSD_ADDRESS)
        .replaceAll(USDC_TESTNET, FXUSD_ADDRESS)
        .replaceAll(USDC_ETH_L1, FXUSD_ADDRESS)
        // Fix balance display: format with 18 decimals, then round to 3 decimal places
        .replaceAll('q=Nm(M,6)', `q=parseFloat(Nm(M,${FXUSD_DECIMALS})).toFixed(3)`)
        .replaceAll('USDC', 'fxUSD');
    }
    return evmPaywall.generateHtml(requirement, paymentRequired, config);
  },
};

const paywall = createPaywall()
  .withNetwork(fixedEvmPaywall)
  .withConfig({
    appName: "Smartclaw",
    testnet: rawNetwork !== "base",
  })
  .build();

const configuredProxy =
  payTo && resourceServer
    ? paymentProxy(
      {
        "/premium": {
          accepts: premiumAccepts,
          description: "Access Smartclaw premium leaderboard insights",
        },
        "/api/premium": {
          accepts: premiumAccepts,
          description: "Access Smartclaw premium leaderboard API",
          mimeType: "application/json",
        },
      },
      resourceServer,
      undefined, // paywallConfig
      paywall,
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

/* ═══════ Main middleware ═══════ */

export async function proxy(request: NextRequest) {
  const isPrefetch =
    request.headers.get("x-middleware-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch";

  if (isPrefetch || request.method === "HEAD" || request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const forwardedProto =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");
  const shouldUseSecureCookies = forwardedProto === "https";

  let clearPremiumAccessCookie = false;
  let clearReason: string | undefined;
  const existingPremiumCookie = request.cookies.get(premiumAccessCookieName);
  if (existingPremiumCookie) {
    const validation = await readPremiumAccessCookie(
      existingPremiumCookie.value,
    );
    if (validation.valid) {
      console.info(
        `[premium-access] Cookie valid until ${validation.expiresAt.toISOString()}`,
      );
      return NextResponse.next();
    }
    clearPremiumAccessCookie = true;
    clearReason = validation.reason;
    if (validation.reason === "expired") {
      console.info("[premium-access] Premium access cookie expired");
    } else if (validation.reason !== "missing") {
      console.warn(
        `[premium-access] Invalid premium access cookie detected (${validation.reason}). Clearing cookie.`,
      );
    }
  }

  let response: NextResponse;
  try {
    response = await configuredProxy(request);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    const lowered = message.toLowerCase();
    const isThrottled = lowered.includes("too many requests");
    if (isThrottled) {
      console.warn(
        "[middleware] payment middleware throttled (429). Premium access unavailable for this request.",
      );
    } else {
      console.error(
        "[middleware] paymentProxy threw an error. Premium access blocked.",
        error,
      );
    }

    const status = isThrottled ? 503 : 502;
    const acceptHeader = request.headers.get("accept") ?? "";
    const errorText = isThrottled
      ? "Premium payment service is temporarily throttled. Please try again shortly."
      : "Premium payment service encountered an error. Please try again.";

    if (acceptHeader.includes("text/html")) {
      const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Premium temporarily unavailable</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #ffffff; color: #111111;"><main style="max-width: 28rem; margin: 0 auto;"><h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Premium temporarily unavailable</h1><p style="margin-bottom: 1rem;">${errorText}</p><p style="color: #555555;">If the issue persists, contact support with timestamp ${new Date().toISOString()}.</p></main></body></html>`;
      return new NextResponse(html, {
        status,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return new NextResponse(
      JSON.stringify({
        error: errorText,
        status,
      }),
      {
        status,
        headers: { "content-type": "application/json" },
      },
    );
  }

  // Normalize resource URLs in 402 JSON responses
  if (
    response.status === 402 &&
    response.headers.get("content-type")?.includes("application/json")
  ) {
    try {
      const payload = await response.clone().json();
      const forwardedHost =
        request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
      const fwdProto =
        request.headers.get("x-forwarded-proto") ??
        request.nextUrl.protocol.replace(":", "");
      const baseUrl = siteUrl ?? `${fwdProto}://${forwardedHost}`;
      const computedResource = `${baseUrl}${request.nextUrl.pathname}`;
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
      response = new NextResponse(JSON.stringify(updated), {
        status: response.status,
        headers,
      });
    } catch (error) {
      console.error("[middleware] Unable to normalize resource URL", error);
    }
  }

  // Normalize resource URLs in 402 HTML responses (paywall)
  if (
    response.status === 402 &&
    response.headers.get("content-type")?.includes("text/html")
  ) {
    const forwardedHost =
      request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
    const fwdProto =
      request.headers.get("x-forwarded-proto") ??
      request.nextUrl.protocol.replace(":", "");
    const baseUrl = siteUrl ?? `${fwdProto}://${forwardedHost}`;
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
      response = new NextResponse(updatedHtml, {
        status: response.status,
        headers,
      });
    } catch (error) {
      console.error("[middleware] Unable to rewrite paywall HTML", error);
    }
  }

  // Issue premium access cookie on successful payment
  const paymentResponseHeader = response.headers.get("X-PAYMENT-RESPONSE");
  if (paymentResponseHeader) {
    try {
      const decoded = atob(paymentResponseHeader);
      const paymentResponse = JSON.parse(decoded) as {
        success?: boolean;
        expiresAt?: string;
      };
      if (paymentResponse?.success) {
        const expiresAt = new Date(Date.now() + premiumAccessDurationMs);
        const cookieValue = await createPremiumAccessCookie(expiresAt);
        if (cookieValue) {
          response.cookies.set({
            name: premiumAccessCookieName,
            value: cookieValue,
            httpOnly: true,
            secure: shouldUseSecureCookies,
            sameSite: "lax",
            path: "/",
            expires: expiresAt,
          });
          clearPremiumAccessCookie = false;
          clearReason = undefined;
          console.info(
            `[premium-access] Granted premium access until ${expiresAt.toISOString()}`,
          );
        } else {
          console.warn(
            "[premium-access] Unable to issue premium access cookie after successful payment.",
          );
        }
      }
    } catch (error) {
      console.error(
        "[premium-access] Failed to process payment response header",
        error,
      );
    }
  } else {
    console.info(
      `[premium-access] No X-PAYMENT-RESPONSE header present (status ${response.status}).`,
    );
  }

  if (clearPremiumAccessCookie) {
    response.cookies.set({
      name: premiumAccessCookieName,
      value: "",
      expires: new Date(0),
      httpOnly: true,
      secure: shouldUseSecureCookies,
      sameSite: "lax",
      path: "/",
    });
    if (clearReason) {
      console.info(
        `[premium-access] Cleared premium access cookie (${clearReason}).`,
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/premium/:path*", "/api/premium/:path*"],
};
