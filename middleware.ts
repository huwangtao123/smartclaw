import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Address } from "viem";
import { safeBase64Decode } from "x402/shared";
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

const premiumResource = siteUrl
  ? (`${siteUrl}/premium` as Resource)
  : undefined;
const premiumApiResource = siteUrl
  ? (`${siteUrl}/api/premium` as Resource)
  : undefined;

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
  const nodeBuffer = (globalThis as Record<string, unknown>).Buffer as
    | {
      from: (
        input: string,
        encoding: string,
      ) => { toString: (encoding: string) => string };
    }
    | undefined;
  const base64 =
    typeof btoa === "function"
      ? btoa(binary)
      : nodeBuffer?.from
        ? nodeBuffer.from(binary, "binary").toString("base64")
        : (() => {
          throw new Error(
            "[premium-access] No base64 encoder available in this environment.",
          );
        })();
  return base64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function decodeBase64Url(base64Url: string) {
  const padded = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLength);
  const nodeBuffer = (globalThis as Record<string, unknown>).Buffer as
    | {
      from: (
        input: string,
        encoding: string,
      ) => { toString: (encoding: string) => string };
    }
    | undefined;
  const binary =
    typeof atob === "function"
      ? atob(base64)
      : nodeBuffer?.from
        ? nodeBuffer.from(base64, "base64").toString("binary")
        : (() => {
          throw new Error(
            "[premium-access] No base64 decoder available in this environment.",
          );
        })();
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index);
  }
  return output;
}

async function signPremiumAccessPayload(payload: string) {
  if (!premiumAccessSecret) {
    return undefined;
  }
  const key = await importPremiumAccessKey(premiumAccessSecret);
  if (!key || !subtleCrypto) {
    return undefined;
  }
  const signature = await subtleCrypto.sign(
    "HMAC",
    key,
    premiumAccessEncoder.encode(payload),
  );
  return encodeBase64Url(new Uint8Array(signature));
}

async function verifyPremiumAccessPayload(payload: string, signature: string) {
  if (!premiumAccessSecret) {
    return false;
  }
  const key = await importPremiumAccessKey(premiumAccessSecret);
  if (!key || !subtleCrypto) {
    return false;
  }
  const signatureBytes = decodeBase64Url(signature);
  return subtleCrypto.verify(
    "HMAC",
    key,
    signatureBytes,
    premiumAccessEncoder.encode(payload),
  );
}

type PremiumAccessCookiePayload = {
  expiresAt: string;
};

async function createPremiumAccessCookie(expiresAt: Date) {
  const payload: PremiumAccessCookiePayload = {
    expiresAt: expiresAt.toISOString(),
  };
  const serialized = JSON.stringify(payload);
  const signature = await signPremiumAccessPayload(serialized);
  if (!signature) {
    return undefined;
  }
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

const facilitatorUrl =
  facilitatorEnv !== undefined
    ? (facilitatorEnv as Resource)
    : rawNetwork === "base"
      ? null
      : ("https://facilitator.heurist.xyz" as Resource);

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
    price: "$0.01",
    network: rawNetwork,
    config: {
      description: "Access AliDashboard premium leaderboard insights",
      resource: premiumResource,
    },
  },
  "/api/premium": {
    price: "$0.01",
    network: rawNetwork,
    config: {
      description: "Access Smartflow premium leaderboard API",
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
    response = await configuredMiddleware(request);
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
        "[middleware] paymentMiddleware threw an error. Premium access blocked.",
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
      response = new NextResponse(JSON.stringify(updated), {
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
      response = new NextResponse(updatedHtml, {
        status: response.status,
        headers,
      });
    } catch (error) {
      console.error("[middleware] Unable to rewrite paywall HTML", error);
    }
  }

  const paymentResponseHeader = response.headers.get("X-PAYMENT-RESPONSE");
  if (paymentResponseHeader) {
    try {
      const decoded = safeBase64Decode(paymentResponseHeader);
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
