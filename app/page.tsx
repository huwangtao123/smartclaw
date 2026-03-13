import type { Metadata } from "next";
import SolanaLanding from "./components/solana-landing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Smartclaw Solana — Agent Intelligence Layer",
  description:
    "Discover, rank, and explain smart money activity on Solana. Connects agents to high-signal token flows, conviction rankings, and risk tags.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <SolanaLanding />;
}
