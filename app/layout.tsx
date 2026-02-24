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
    icon: "/fx-protocol-icon.svg",
  },
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "Smartclaw — Cross-Protocol Smart Wallet Tracker",
    description:
      "API-powered smart wallet tracking across DeFi protocol leaderboards.",
    url: BASE_URL,
    siteName: "Smartclaw",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Smartclaw",
    description:
      "Cross-protocol smart wallet tracking API for AI agents.",
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
      sameAs: [],
    },
    {
      "@type": "WebAPI",
      name: "Smartclaw API",
      url: `${BASE_URL}/api/openapi`,
      documentation: `${BASE_URL}/SKILL.md`,
      description:
        "REST API providing smart wallet PNL, ROI, and lending rate data across DeFi protocols.",
      provider: {
        "@type": "Organization",
        name: "Smartclaw",
      },
      termsOfService: `${BASE_URL}/llms.txt`,
    },
    {
      "@type": "WebSite",
      name: "Smartclaw",
      url: BASE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${BASE_URL}/api/fx/top-pnl?limit={limit}`,
        "query-input": "required name=limit",
      },
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

