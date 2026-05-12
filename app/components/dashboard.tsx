"use client";

import { MarketOverview } from "@/app/components/MarketOverview";
import { NavbarWithState } from "@/components/ui/Navbar";
import type { FxActivitySnapshot } from "@/lib/fxActivity";
import type { FxLeaderboardSnapshot } from "@/lib/fxLeaderboard";
import type { DashboardMetrics } from "@/lib/types";

export default function Dashboard({
  metrics,
  activitySnapshot,
  recentLeaderboard,
}: {
  metrics: DashboardMetrics;
  activitySnapshot: FxActivitySnapshot | null;
  recentLeaderboard?: FxLeaderboardSnapshot | null;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden text-slate-200">
      <NavbarWithState />
      <MarketOverview
        metrics={metrics}
        activitySnapshot={activitySnapshot}
        recentLeaderboard={recentLeaderboard}
      />
    </div>
  );
}
