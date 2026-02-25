import Link from "next/link";
import type { Metadata } from "next";

import { NavbarWithState } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Docs — Smartclaw API",
    description:
        "API documentation for Smartclaw: endpoints, authentication, SKILL.md, and integration guides for AI agents.",
};

const endpoints = [
    {
        method: "GET",
        path: "/api/top-pnl",
        description: "Global top PNL wallets across all protocols",
        auth: "None",
    },
    {
        method: "GET",
        path: "/api/fx/status",
        description: "f(x) Protocol health snapshot",
        auth: "None",
    },
    {
        method: "GET",
        path: "/api/fx/top-pnl",
        description: "f(x) Protocol top PNL wallets",
        auth: "None",
    },
    {
        method: "GET",
        path: "/api/fx/fxusd-rate",
        description: "fxUSD borrow rate (latest + historical)",
        auth: "None",
    },
    {
        method: "GET",
        path: "/api/rates",
        description: "Cross-protocol lending rate comparison",
        auth: "None",
    },
    {
        method: "GET",
        path: "/api/premium",
        description: "Premium leaderboard metrics (top-10 by PNL & ROI)",
        auth: "x402 ($0.08 fxUSD / $0.10 USDC)",
    },
];

const facts = [
    {
        label: "Tracked wallets",
        value: "1,700+",
        detail: "Across f(x) Protocol leaderboard",
    },
    {
        label: "Protocols live",
        value: "1",
        detail: "f(x) Protocol — Perp DEX & Meme Coins coming soon",
    },
    {
        label: "Premium cost",
        value: "$0.08",
        detail: "fxUSD per call (20% off) or $0.10 USDC on Base via x402",
    },
    {
        label: "Data source",
        value: "On-chain",
        detail: "Live snapshots from protocol APIs and The Graph",
    },
];

const faqs = [
    {
        q: "What is Smartclaw?",
        a: "Smartclaw is a cross-protocol smart wallet tracking API. It aggregates PNL, ROI, and capital flow signals from DeFi protocol leaderboards, currently tracking 1,700+ wallets on f(x) Protocol.",
    },
    {
        q: "How do AI agents integrate with Smartclaw?",
        a: "Copy the SKILL.md file into your agent's context. It includes endpoint URLs, response schemas, formatting rules, and recommended multi-step workflows. No API key required for public endpoints.",
    },
    {
        q: "What does premium access include?",
        a: "Premium endpoints return the top-10 traders ranked by PNL and ROI. Each call costs $0.08 fxUSD (20% off) or $0.10 USDC on Base network, paid automatically via the x402 payment protocol.",
    },
    {
        q: "How fresh is the data?",
        a: "Data is sourced from on-chain snapshots via the f(x) Protocol leaderboard API and The Graph. Dashboard data refreshes on every page load. Lending rates are updated daily.",
    },
];

export default function DocsPage() {
    const now = new Date();

    return (
        <div className="min-h-screen bg-surface text-white">
            <NavbarWithState />
            <div className="mx-auto max-w-4xl px-6 pt-16 pb-20">
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                    Smartclaw API Docs
                </h1>
                <p className="text-sm text-white/40 mb-1">
                    Everything AI agents and developers need to integrate with Smartclaw.
                </p>
                <p className="text-xs text-white/20 mb-12">
                    <time dateTime={now.toISOString()}>
                        Last updated:{" "}
                        {now.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </time>
                </p>

                {/* ── Quick Facts ── */}
                <section className="mb-14">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        Quick Facts
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {facts.map((f) => (
                            <GlassCard key={f.label} className="p-4">
                                <div className="text-xs text-white/30 uppercase tracking-widest mb-1">
                                    {f.label}
                                </div>
                                <div className="text-xl font-bold text-neon-400">
                                    {f.value}
                                </div>
                                <div className="text-xs text-white/40 mt-1">{f.detail}</div>
                            </GlassCard>
                        ))}
                    </div>
                </section>

                {/* ── Endpoints ── */}
                <section className="mb-14">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        API Endpoints
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="text-left text-white/30 text-xs uppercase tracking-widest">
                                    <th className="pb-3">Method</th>
                                    <th className="pb-3">Path</th>
                                    <th className="pb-3">Description</th>
                                    <th className="pb-3">Auth</th>
                                </tr>
                            </thead>
                            <tbody>
                                {endpoints.map((ep) => (
                                    <tr
                                        key={ep.path}
                                        className="border-t border-white/[0.06]"
                                    >
                                        <td className="py-3 font-mono text-neon-400 text-xs">
                                            {ep.method}
                                        </td>
                                        <td className="py-3 font-mono text-white/60 text-xs">
                                            {ep.path}
                                        </td>
                                        <td className="py-3 text-white/50">{ep.description}</td>
                                        <td className="py-3 text-white/30 text-xs">{ep.auth}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ── Data Sources & Methodology ── */}
                <section className="mb-14">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        Data Sources & Methodology
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <GlassCard className="p-5">
                            <h3 className="text-sm font-semibold text-white mb-2">
                                Smart Wallet Data
                            </h3>
                            <p className="text-xs text-white/40 leading-relaxed">
                                Wallet PNL, ROI, and volume are sourced from the{" "}
                                <strong className="text-white/60">f(x) Protocol leaderboard API</strong>.
                                Data reflects cumulative on-chain positions. The leaderboard tracks all
                                wallets that have interacted with f(x) Protocol vaults.
                            </p>
                        </GlassCard>
                        <GlassCard className="p-5">
                            <h3 className="text-sm font-semibold text-white mb-2">
                                Lending Rates
                            </h3>
                            <p className="text-xs text-white/40 leading-relaxed">
                                fxUSD, Aave, and CrvUSD borrow rates are collected daily from{" "}
                                <strong className="text-white/60">The Graph</strong> and protocol
                                subgraphs. Historical data goes back to January 2025. Rates are APR
                                (annualized percentage rate).
                            </p>
                        </GlassCard>
                        <GlassCard className="p-5">
                            <h3 className="text-sm font-semibold text-white mb-2">
                                Update Frequency
                            </h3>
                            <p className="text-xs text-white/40 leading-relaxed">
                                Dashboard and top-pnl data refresh on{" "}
                                <strong className="text-white/60">every page load</strong> (force-dynamic).
                                Lending rates update{" "}
                                <strong className="text-white/60">daily at midnight UTC</strong>.
                                Premium metrics are computed in real-time per request.
                            </p>
                        </GlassCard>
                        <GlassCard className="p-5">
                            <h3 className="text-sm font-semibold text-white mb-2">
                                Metrics Methodology
                            </h3>
                            <p className="text-xs text-white/40 leading-relaxed">
                                <strong className="text-white/60">Win rate</strong> = % of wallets with
                                positive PNL.{" "}
                                <strong className="text-white/60">Weighted win rate</strong> = % of total
                                volume from winning wallets.{" "}
                                <strong className="text-white/60">Momentum</strong> = net capital flow share
                                of winning wallets vs total.
                            </p>
                        </GlassCard>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="mb-14">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        {faqs.map((faq) => (
                            <GlassCard key={faq.q} className="p-5">
                                <h3 className="text-sm font-semibold text-white mb-2">
                                    {faq.q}
                                </h3>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    {faq.a}
                                </p>
                            </GlassCard>
                        ))}
                    </div>
                </section>

                {/* ── SKILL.md ── */}
                <section className="mb-14">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        For AI Agents
                    </h2>
                    <GlassCard className="p-6">
                        <p className="text-sm text-white/50 mb-4">
                            Copy the SKILL.md file to your AI agent&apos;s context. It includes
                            endpoint details, response examples, formatting rules, and
                            recommended workflows.
                        </p>
                        <div className="flex gap-3">
                            <Link
                                href="/SKILL.md"
                                target="_blank"
                                className="inline-flex items-center rounded-lg bg-neon-500/10 border border-neon-500/20 px-4 py-2 text-xs font-medium text-neon-400 hover:bg-neon-500/20 transition"
                            >
                                View SKILL.md →
                            </Link>
                            <Link
                                href="/api/openapi"
                                target="_blank"
                                className="inline-flex items-center rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-medium text-white/50 hover:text-white/70 transition"
                            >
                                OpenAPI Spec →
                            </Link>
                        </div>
                    </GlassCard>
                </section>

                {/* ── Discovery & Specs ── */}
                <section className="mb-14">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        Discovery Files
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {[
                            { label: "OpenAPI 3.1", path: "/api/openapi" },
                            { label: "SKILL.md", path: "/SKILL.md" },
                            { label: "Agent Descriptor", path: "/agents.json" },
                            { label: "Plugin Manifest", path: "/.well-known/ai-plugin.json" },
                            { label: "LLM Summary", path: "/llms.txt" },
                            { label: "RSS Feed", path: "/feed.xml" },
                        ].map((spec) => (
                            <Link
                                key={spec.path}
                                href={spec.path}
                                target="_blank"
                                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm hover:border-white/10 transition"
                            >
                                <span className="text-white/50">{spec.label}</span>
                                <span className="font-mono text-xs text-white/30">
                                    {spec.path}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* ── Internal Links / Navigation ── */}
                <section>
                    <h2 className="text-lg font-semibold text-white mb-4">
                        Explore
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/"
                            className="rounded-lg border border-white/[0.06] px-4 py-2 text-sm text-white/40 hover:text-white/60 transition"
                        >
                            ← Dashboard
                        </Link>
                        <Link
                            href="/premium"
                            className="rounded-lg border border-white/[0.06] px-4 py-2 text-sm text-white/40 hover:text-white/60 transition"
                        >
                            Premium Analytics →
                        </Link>
                        <Link
                            href="/fxmint"
                            className="rounded-lg border border-white/[0.06] px-4 py-2 text-sm text-white/40 hover:text-white/60 transition"
                        >
                            fxUSD Rates →
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
