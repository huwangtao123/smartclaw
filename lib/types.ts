export type Trader = {
  rank: number;
  trader: string;
  roi?: number;
  pnl?: number;
  pnlClean?: number;
  vol?: number;
  net?: number;
};

export type DashboardMetrics = {
  totalTraders: number;
  winningCount: number;
  losingCount: number;
  winningRate: number;
  weightedWinningRate: number;
  winningVol: number;
  totalVol: number;
  winningNet: number;
  totalNet: number;
  netMomentumShare: number;
  totalPnl: number;
  avgRoi: number;
  topByPnl: Trader[];
  topByRoi: Trader[];
  hasMajorityMomentum: boolean;
};
