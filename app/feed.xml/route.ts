import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://smartclaw.xyz";

export async function GET() {
    const now = new Date().toISOString();

    const items = [
        {
            title: "f(x) Protocol Smart Wallet Tracking Live",
            link: `${BASE_URL}/api/fx/status`,
            description:
                "Track 1,700+ smart wallets on f(x) Protocol. PNL, ROI, volume, and win rate data available via API.",
            pubDate: "2026-02-24T00:00:00Z",
            guid: "smartclaw-fx-launch",
        },
        {
            title: "Cross-Protocol Lending Rate Comparison",
            link: `${BASE_URL}/api/rates`,
            description:
                "Compare borrow rates across Aave, CrvUSD, and fxUSD in real time via the /api/rates endpoint.",
            pubDate: "2026-02-24T00:00:00Z",
            guid: "smartclaw-rates-launch",
        },
        {
            title: "Premium Leaderboard Analytics via x402",
            link: `${BASE_URL}/api/premium`,
            description:
                "Top-10 traders by PNL and ROI, available for $0.01 USDC per request using the x402 payment protocol.",
            pubDate: "2026-02-24T00:00:00Z",
            guid: "smartclaw-premium-launch",
        },
    ];

    const rssItems = items
        .map(
            (item) => `    <item>
      <title>${item.title}</title>
      <link>${item.link}</link>
      <description>${item.description}</description>
      <pubDate>${new Date(item.pubDate).toUTCString()}</pubDate>
      <guid isPermaLink="false">${item.guid}</guid>
    </item>`,
        )
        .join("\n");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Smartclaw — Cross-Protocol Smart Wallet Tracker</title>
    <link>${BASE_URL}</link>
    <description>Cross-protocol smart wallet tracking API. PNL, ROI, and capital flow signals across DeFi protocol leaderboards.</description>
    <language>en</language>
    <lastBuildDate>${new Date(now).toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <docs>https://www.rssboard.org/rss-specification</docs>
${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rss, {
        headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
}
