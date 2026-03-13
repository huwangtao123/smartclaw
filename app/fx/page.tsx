import type { Metadata } from "next";

import { loadFilteredTraders } from "@/lib/data";
import { computeMetrics } from "@/lib/metrics";
import { updateDashboardData } from "@/lib/updateData";
import Dashboard from "../components/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Smartclaw — Cross-Protocol Smart Wallet Tracker",
  description:
    "Track 1,700+ smart wallets across f(x) Protocol. Real-time PNL, ROI, volume, and win rate data. Copy SKILL.md to give your AI agent instant API access.",
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  await updateDashboardData();
  const traders = await loadFilteredTraders();
  const metrics = computeMetrics(traders);

  return <Dashboard metrics={metrics} />;
}
