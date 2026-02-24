---
name: smartclaw-api
description: Cross-protocol smart wallet tracking — top PNL wallets (global & per-protocol), fxUSD borrow rates, lending rate comparisons, and premium analytics. Pay-per-call premium via x402.
---

# Smartclaw API

Cross-protocol smart wallet tracking. Aggregate PNL, ROI, and capital flow signals across protocol leaderboards.

**Base URL**: `https://smartclaw.xyz`

## Endpoints

### 1. Global Top PNL Wallets

**`GET /api/top-pnl?limit={n}`** — No auth

Returns top PNL wallets aggregated across all integrated protocols. Each entry includes `protocol` field.

| Param   | Type | Default | Description               |
| ------- | ---- | ------- | ------------------------- |
| `limit` | int  | 10      | Wallets to return (1–100) |

```json
{
  "data": [
    {
      "trader": "0xafd85073...",
      "roi": 80.61,
      "pnl": 11494279.94,
      "pnlClean": 11494279.94,
      "vol": 147394178.19,
      "net": null,
      "protocol": "fx"
    }
  ],
  "meta": {
    "protocols": ["fx"],
    "limit": 2,
    "total": 1727,
    "generatedAt": "2026-02-24T00:49:33.089Z"
  }
}
```

---

### 2. f(x) Protocol Top PNL Wallets

**`GET /api/fx/top-pnl?limit={n}`** — No auth

Returns top PNL wallets from the f(x) Protocol leaderboard only.

| Param   | Type | Default | Description               |
| ------- | ---- | ------- | ------------------------- |
| `limit` | int  | 10      | Wallets to return (1–100) |

```json
{
  "data": [
    {
      "trader": "0xafd85073...",
      "roi": 80.61,
      "pnl": 11494279.94,
      "pnlClean": 11494279.94,
      "vol": 147394178.19,
      "net": null
    }
  ],
  "meta": {
    "protocol": "fx",
    "limit": 2,
    "total": 1727,
    "generatedAt": "2026-02-24T00:49:33.343Z"
  }
}
```

---

### 3. f(x) Protocol Status

**`GET /api/fx/status`** — No auth

Returns protocol overview: tracked wallets, winners, win rates, volume, PNL, and momentum.

```json
{
  "protocol": "fx",
  "trackedWallets": 1727,
  "winners": 440,
  "losers": 1287,
  "winRate": 25.48,
  "weightedWinRate": 35.5,
  "totalVolume": 1200000000,
  "totalPnl": 5000000,
  "avgRoi": 12.5,
  "netMomentumShare": 4.2,
  "hasMajorityMomentum": false,
  "generatedAt": "2026-02-24T00:49:33.089Z"
}
```

---

### 4. fxUSD Borrow Rate

**`GET /api/fx/fxusd-rate?limit={n}&maWindow={w}`** — No auth

Returns latest and historical fxUSD borrow APR from f(x) Protocol.

| Param      | Type | Default | Description                      |
| ---------- | ---- | ------- | -------------------------------- |
| `limit`    | int  | all     | Historical data points to return |
| `maWindow` | int  | 30      | Moving average window in days    |

```json
{
  "latest": { "date": "2026-02-23", "rate": 4.95 },
  "series": [
    { "date": "2026-02-23", "rate": 4.95 },
    { "date": "2026-02-22", "rate": 5.12 }
  ],
  "meta": {
    "protocol": "fx",
    "maWindow": 30,
    "lastUpdated": "2026-02-23T00:00:00.000Z",
    "source": "fallback"
  }
}
```

---

### 5. Cross-Protocol Lending Rates

**`GET /api/rates?maWindow={w}`** — No auth

Returns borrow rates across Aave, CrvUSD, and fxUSD for comparison.

| Param      | Type | Default | Description                   |
| ---------- | ---- | ------- | ----------------------------- |
| `maWindow` | int  | 30      | Moving average window in days |

```json
{
  "series": [
    {
      "date": "2025-01-01",
      "aaveBorrow": 11.90,
      "crvusdAvg": 12.57,
      "fxusdBorrow": 5.20
    }
  ],
  "maWindow": 30,
  "lastUpdated": "2026-02-23T00:00:00.000Z",
  "source": "fallback",
  "assetPrices": { "WBTC": 64744.78, "wstETH": 2287.88 }
}
```

---

### 6. Premium Leaderboard Metrics

**`GET /api/premium`** — Requires x402 payment ($0.01 USDC on Base)

Returns full top-10 traders by PNL and ROI.

```json
{
  "x402Version": 1,
  "protocol": "fx",
  "topByPnl": [ { "rank": 1, "trader": "0x...", "pnl": 11494279.94, "..." } ],
  "topByRoi": [ { "rank": 1, "trader": "0x...", "roi": 724.0, "..." } ],
  "generatedAt": "2026-02-24T00:49:33.089Z"
}
```

## x402 Payment (Premium Access)

Premium endpoints return `402 Payment Required`. The agent needs a Base wallet with USDC.

### x402-fetch (recommended)

```javascript
import { wrapFetch } from "x402-fetch"; // npm install x402-fetch

const payingFetch = wrapFetch(fetch, {
  privateKey: "0x...", // EVM private key with USDC on Base
});

const res = await payingFetch("https://smartclaw.xyz/api/premium");
const data = await res.json();
```

### x402-python

```python
from x402 import x402_requests  # pip install x402

response = x402_requests.get(
    "https://smartclaw.xyz/api/premium",
    private_key="0x..."
)
data = response.json()
```

### Cost

**$0.01 USDC** per call on Base network.

## URL Pattern

```
/api/top-pnl              → Global aggregate across all protocols
/api/fx/top-pnl            → f(x) Protocol specific
/api/fx/fxusd-rate         → f(x) Protocol specific
/api/rates                 → Cross-protocol comparison
/api/premium               → Premium (x402-gated)
/api/perp/...              → Perp DEX (coming soon)
/api/meme/...              → Meme Coins (coming soon)
```

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

### Data Interpretation

| Field                 | Meaning                             | Good/Bad Signal                                 |
| --------------------- | ----------------------------------- | ----------------------------------------------- |
| `weightedWinRate`     | % of volume from profitable wallets | > 40% = strong, < 25% = weak                    |
| `winRate`             | % of wallets that are profitable    | Context only — don't compare to weightedWinRate |
| `totalPnl`            | Sum of all PNL (can be negative)    | Positive = net profitable market                |
| `netMomentumShare`    | Winners' net capital as % of total  | > 50% = winner-dominated flow                   |
| `hasMajorityMomentum` | `weightedWinRate >= 50%`            | true = bullish signal                           |
| `pnl` vs `pnlClean`   | pnlClean excludes outliers          | Use `pnl` for display, `pnlClean` for ranking   |
| `roi`                 | Return on investment (%)            | > 100% = doubled their money                    |
| `vol`                 | Total traded volume for this wallet | Higher = more active trader                     |

### Formatting Rules

When presenting data to users, apply these formatting rules:

- **PNL/Volume**: Use compact notation — `$11.5M` not `$11494279.94`
- **ROI**: Show as percentage — `80.6%` not `80.61379`
- **Win Rate**: Show as percentage with 1 decimal — `35.5%`
- **Wallet addresses**: Truncate — `0xafd8...D27e` (first 6 + last 4)
- **Dates**: Use relative time when possible — "2 hours ago" not ISO timestamps
- **Tables**: Always present top wallets as a table, not a list

Example output for top wallets:

```
| #   | Wallet        | PNL    | ROI    | Volume  |
| --- | ------------- | ------ | ------ | ------- |
| 1   | 0xafd8...D27e | $11.5M | 80.6%  | $147.4M |
| 2   | 0x277C...F6F3 | $3.8M  | 348.3% | $79.0M  |
```

### Domain Context

- **f(x) Protocol** is a DeFi protocol for leveraged positions on Ethereum. Traders deposit collateral and borrow fxUSD (a stablecoin).
- **PNL** = Profit and Loss from trading positions.
- **fxUSD borrow rate** = The annual interest rate for borrowing fxUSD. Lower is better for traders.
- **Aave & CrvUSD** are competing DeFi lending protocols. The `/api/rates` endpoint lets you compare costs.
- A trader with high PNL + high volume = **consistently profitable**. High PNL + low volume = **got lucky on one big trade**.

