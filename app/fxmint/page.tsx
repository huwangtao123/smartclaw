import { loadRates } from "@/lib/rates";
import { RatesClient } from "./RatesClient";

export const dynamic = "force-dynamic";

export default async function RatesPage() {
  const data = await loadRates();
  if (!data.series.length) {
    // Surface a friendly error state client-side instead of a hard 404.
    return <RatesClient data={data} />;
  }
  return <RatesClient data={data} />;
}
