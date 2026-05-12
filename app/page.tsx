import type { Metadata } from "next";

import { loadFilteredTraders } from "@/lib/data";
import { fetchFxActivitySnapshot } from "@/lib/fxActivity";
import { fetchFxLeaderboardSnapshot } from "@/lib/fxLeaderboard";
import { computeMetrics } from "@/lib/metrics";
import { updateDashboardData } from "@/lib/updateData";
import Dashboard from "./components/dashboard";

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
  const activitySnapshotPromise = fetchFxActivitySnapshot().catch((error) => {
    console.error("Failed to load FX activity snapshot for homepage", error);
    return null;
  });
  const recentLeaderboardPromise = fetchFxLeaderboardSnapshot("7D").catch(
    (error) => {
      console.error("Failed to load 7D FX leaderboard for homepage", error);
      return null;
    },
  );

  await updateDashboardData();
  const traders = await loadFilteredTraders();
  const metrics = computeMetrics(traders);
  const [activitySnapshot, recentLeaderboard] = await Promise.all([
    activitySnapshotPromise,
    recentLeaderboardPromise,
  ]);

  return (
    <Dashboard
      metrics={metrics}
      activitySnapshot={activitySnapshot}
      recentLeaderboard={recentLeaderboard}
    />
  );
}
