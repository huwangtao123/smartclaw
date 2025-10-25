import Dashboard from "./components/dashboard";

import type { DashboardMetrics, Trader } from "@/lib/types";
import { getPnl, loadFilteredTraders } from "@/lib/data";
import { updateDashboardData } from "@/lib/updateData";

export const dynamic = "force-dynamic";

function computeMetrics(traders: Trader[]): DashboardMetrics {
  const totalTraders = traders.length;
  const pnlValue = (row: Trader) => getPnl(row);
  const winners = traders.filter((row) => pnlValue(row) > 0);
  const winningCount = winners.length;
  const losingCount = totalTraders - winningCount;

  const totalPnl = traders.reduce((acc, row) => acc + pnlValue(row), 0);
  const totalVol = traders.reduce((acc, row) => acc + (row.vol ?? 0), 0);
  const totalNet = traders.reduce((acc, row) => acc + (row.net ?? 0), 0);

  const winningVol = winners.reduce((acc, row) => acc + (row.vol ?? 0), 0);
  const winningNet = winners.reduce((acc, row) => acc + (row.net ?? 0), 0);

  const winningRate = totalTraders ? winningCount / totalTraders : 0;
  const weightedWinningRate = totalVol ? winningVol / totalVol : 0;
  const netMomentumShare = totalNet ? winningNet / totalNet : 0;

  const topByPnl = winners
    .slice()
    .sort((a, b) => pnlValue(b) - pnlValue(a))
    .slice(0, 6);

  const topByRoi = traders
    .slice()
    .sort((a, b) => (b.roi ?? Number.NEGATIVE_INFINITY) - (a.roi ?? Number.NEGATIVE_INFINITY))
    .slice(0, 6);

  const avgRoi = totalTraders
    ? traders.reduce((acc, row) => acc + (row.roi ?? 0), 0) / totalTraders
    : 0;

  return {
    totalTraders,
    winningCount,
    losingCount,
    winningRate,
    weightedWinningRate,
    winningVol,
    totalVol,
    winningNet,
    totalNet,
    netMomentumShare,
    totalPnl,
    avgRoi,
    topByPnl,
    topByRoi,
    hasMajorityMomentum: weightedWinningRate >= 0.5,
  };
}

export default async function Home() {
  await updateDashboardData();
  const traders = await loadFilteredTraders();
  const metrics = computeMetrics(traders);

  return <Dashboard metrics={metrics} />;
}
