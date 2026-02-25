import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://smartclaw.xyz";

export const metadata: Metadata = {
  title: "Smartclaw — Cross-Protocol Smart Wallet Tracker",
  description:
    "Track smart wallets across protocol leaderboards. Aggregate PNL, ROI, and capital flow signals from f(x) Protocol, Perp DEXes, and more.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "Smartclaw — Cross-Protocol Smart Wallet Tracker",
    description:
      "API-powered smart wallet tracking across DeFi protocol leaderboards.",
    url: BASE_URL,
    siteName: "Smartclaw",
    type: "website",
    images: [{ url: "/og_1200x630.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smartclaw",
    description:
      "Cross-protocol smart wallet tracking API for AI agents.",
    images: ["/og_1200x630.png"],
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
      "text/plain": "/llms.txt",
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Smartclaw",
      url: BASE_URL,
      description:
        "Cross-protocol smart wallet tracking platform for DeFi traders and AI agents.",
      foundingDate: "2026-01-01",
      sameAs: [],
    },
    {
      "@type": "WebAPI",
      name: "Smartclaw API",
      url: `${BASE_URL}/api/openapi`,
      documentation: `${BASE_URL}/SKILL.md`,
      description:
        "REST API providing smart wallet PNL, ROI, and lending rate data across DeFi protocols. Tracks 1,700+ wallets on f(x) Protocol with real-time on-chain data.",
      provider: {
        "@type": "Organization",
        name: "Smartclaw",
      },
      termsOfService: `${BASE_URL}/llms.txt`,
      datePublished: "2026-01-15",
      dateModified: new Date().toISOString().split("T")[0],
    },
    {
      "@type": "WebSite",
      name: "Smartclaw",
      url: BASE_URL,
      datePublished: "2026-01-15",
      dateModified: new Date().toISOString().split("T")[0],
      potentialAction: {
        "@type": "SearchAction",
        target: `${BASE_URL}/api/fx/top-pnl?limit={limit}`,
        "query-input": "required name=limit",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Smartclaw?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Smartclaw is a cross-protocol smart wallet tracking API. It aggregates PNL, ROI, and capital flow signals from DeFi protocol leaderboards, currently tracking 1,700+ wallets on f(x) Protocol.",
          },
        },
        {
          "@type": "Question",
          name: "How do AI agents use Smartclaw?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Copy the SKILL.md file to your AI agent's context. It includes endpoint details, response examples, formatting rules, and recommended workflows. Agents can then call REST API endpoints to get smart wallet data.",
          },
        },
        {
          "@type": "Question",
          name: "How much does Smartclaw cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Most endpoints are free and require no authentication. Premium endpoints cost $0.01 fxUSD per call on Base network using the x402 payment protocol.",
          },
        },
        {
          "@type": "Question",
          name: "What data does Smartclaw track?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Smartclaw tracks wallet PNL (profit and loss), ROI (return on investment), trading volume, win rates, and capital flow momentum across DeFi protocol leaderboards. It also compares lending rates across Aave, CrvUSD, and fxUSD.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Smartclaw Updates"
          href="/feed.xml"
        />
      </head>
      <body
        className={`${plexSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

