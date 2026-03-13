---
name: smartclaw-solana
description: Agent Intelligence Layer for discovering, ranking, and explaining smart money activity on Solana. Connects agents to high-signal token flows, conviction rankings, and risk tags.
---

# Smartclaw Solana API

Agent-ready intelligence layer for discovering, ranking, and explaining smart money activity on Solana without acting as an execution endpoint.

**Base URL**: `https://smartclaw.xyz`

## Primary Endpoints (Solana Intelligence)

### 1. Network Status & Overview
**`GET /api/solana/overview`** — No auth

Get current Solana network monitoring scale, active wallets, token coverage, and latest rotation shifts.

### 2. Ranked Conviction Wallets
**`GET /api/solana/smart-money?limit={n}`** — No auth

Get high-priority ranked smart money wallets, signal strength, and recent behavior summaries on Solana.

### 3. Token Capital Flow
**`GET /api/solana/token-flow?symbolOrMint={token}`** — No auth

Get smart money capital flow, participating addresses, and trend changes for a specific Solana token.

### 4. Agent-Ready Watchlist
**`GET /api/solana/watchlist?limit={n}`** — No auth

Get an agent-ready watchlist of Solana tokens/wallets with conviction explanations, risk tags, and freshness.

### 5. Behavior Explanation
**`GET /api/solana/explain?subject={subject}&id={id}`** — No auth

Get a structured explanation of conviction or behavior for a specific Solana wallet, token, or narrative.

---

## Legacy Endpoints (f(x) Protocol / Ethereum / Base)

*(Note: The following endpoints relate to Smartclaw's legacy cross-protocol analytics.)*

### 1. f(x) Protocol Top PNL Wallets
**`GET /api/fx/top-pnl?limit={n}`** — No auth

### 2. f(x) Protocol Status
**`GET /api/fx/status`** — No auth

### 3. Premium Leaderboard Metrics (x402)
**`GET /api/premium`** — Requires x402 payment ($0.01 fxUSD on Base)

Premium endpoints return `402 Payment Required`.

**⚠️ IMPORTANT: Do NOT directly transfer fxUSD to any address. x402 uses a signature-based authorization flow — not direct transfers. Use `x402-fetch` to securely communicate with this endpoint.**
