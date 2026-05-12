---
name: smartclaw-api
description: Cross-protocol smart wallet tracking — top PNL wallets (global & per-protocol), fxUSD borrow rates, lending rate comparisons, and public leaderboard analytics.
---

# Smartclaw API

Cross-protocol smart wallet tracking. Aggregate PNL, ROI, and capital flow signals across protocol leaderboards.

**Base URL**: `https://smartclaw.xyz`

## Endpoints

### 1. Global Top PNL Wallets

**`GET /api/top-pnl?limit={n}`** — No auth

Returns top PNL wallets aggregated across all integrated protocols.

### 2. f(x) Protocol Top PNL Wallets

**`GET /api/fx/top-pnl?limit={n}`** — No auth

Returns top PNL wallets from the f(x) Protocol leaderboard only.

### 3. f(x) Protocol Status

**`GET /api/fx/status`** — No auth

Returns protocol overview: tracked wallets, winners, win rates, volume, PNL, and momentum.

### 4. fxUSD Borrow Rate

**`GET /api/fx/fxusd-rate?limit={n}&maWindow={w}`** — No auth

Returns latest and historical fxUSD borrow APR from f(x) Protocol.

### 5. Cross-Protocol Lending Rates

**`GET /api/rates?maWindow={w}`** — No auth

Returns borrow rates across Aave, CrvUSD, and fxUSD for comparison.

### 6. Public Leaderboard Metrics

**`GET /api/premium`** — No auth

Returns full top-10 traders by PNL and ROI.

```json
{
  "protocol": "fx",
  "topByPnl": [ { "rank": 1, "trader": "0x...", "pnl": 11494279.94 } ],
  "topByRoi": [ { "rank": 1, "trader": "0x...", "roi": 724.0 } ],
  "generatedAt": "2026-02-24T00:49:33.089Z"
}
```

## Public Access Notes

`/api/premium` is public and returns the same leaderboard analytics as the `/premium` page.

## Machine-Readable Specs

- **OpenAPI 3.1**: `GET /api/openapi`
- **LLM summary**: `GET /llms.txt`
- **Agent descriptor**: `GET /agents.json`

---

## Agent Usage Guide

### Example Prompts → API Calls

| User asks                          | Call                                                    | Then                                |
| ---------------------------------- | ------------------------------------------------------- | ----------------------------------- |
| "How's f(x) Protocol doing?"       | `GET /api/fx/status`                                    | Summarize wallets, win rate, volume |
| "Who are the top traders?"         | `GET /api/fx/top-pnl?limit=5`                           | Show as a ranked table              |
| "What's the fxUSD borrow rate?"    | `GET /api/fx/fxusd-rate?limit=7`                        | Show latest + 7-day trend           |
| "Compare lending rates"            | `GET /api/rates`                                        | Compare fxUSD vs Aave vs CrvUSD     |
| "Top wallets across all protocols" | `GET /api/top-pnl?limit=10`                             | Global view with protocol labels    |
| "Give me the full picture"         | `GET /api/fx/status` then `GET /api/fx/top-pnl?limit=3` | Status + top wallets combo          |

### Recommended Workflows

**Quick Overview** (best starting point):
1. `GET /api/fx/status` → Get protocol health snapshot
2. If `weightedWinRate` > 40%, say "Winning wallets dominate trading activity"
3. If `hasMajorityMomentum` is true, say "Capital momentum favors winners"

**Deep Dive**:
1. `GET /api/fx/status` → Overall health
2. `GET /api/fx/top-pnl?limit=5` → Top performers
3. `GET /api/fx/fxusd-rate?limit=30` → Rate trend for context

**Rate Comparison**:
1. `GET /api/rates` → All protocols
2. Compare `fxusdBorrow` vs `aaveBorrow` vs `crvusdAvg`
3. Recommend the lowest rate for borrowing

### Formatting Rules

- **PNL/Volume**: Use compact notation — `$11.5M` not `$11494279.94`
- **ROI**: Show as percentage — `80.6%` not `80.61379`
- **Win Rate**: Show as percentage with 1 decimal — `35.5%`
- **Wallet addresses**: Truncate — `0xafd8...D27e` (first 6 + last 4)
- **Dates**: Use relative time when possible — "2 hours ago" not ISO timestamps
- **Tables**: Always present top wallets as a table, not a list
