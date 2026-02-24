import type { Metadata } from "next";

import { loadRates } from "@/lib/rates";
import { RatesClient } from "./RatesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lending Rates — Smartclaw",
  description:
    "Compare DeFi borrow rates across fxUSD, Aave, and CrvUSD. Historical trends with configurable moving averages. Data sourced from on-chain snapshots.",
  alternates: {
    canonical: "/fxmint",
  },
};

export default async function RatesPage() {
  const data = await loadRates();
  if (!data.series.length) {
    // Surface a friendly error state client-side instead of a hard 404.
    return <RatesClient data={data} />;
  }
  return <RatesClient data={data} />;
}
