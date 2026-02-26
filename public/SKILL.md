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

**`GET /api/premium`** — Requires x402 payment ($0.01 fxUSD on Base)

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

Premium endpoints return `402 Payment Required`.

**⚠️ IMPORTANT: Do NOT directly transfer fxUSD to any address. x402 uses a signature-based authorization flow — not direct transfers.**

### How x402 Works

x402 uses **EIP-3009 `transferWithAuthorization`** — a gasless, signature-based payment protocol:

1. Agent calls the premium endpoint → server returns `402` with payment details
2. Agent **signs** an EIP-3009 authorization (containing from, to, value, validAfter, validBefore, nonce) using its private key
3. Agent sends the **signed authorization** back in the `PAYMENT-SIGNATURE` (legacy `X-PAYMENT` may still be accepted) header
4. Server verifies the signature and executes `transferWithAuthorization` on-chain
5. Server returns the premium data

**The agent never sends a transaction itself. It only signs an authorization. The server handles the on-chain transfer.**

### x402-fetch (recommended)

The `x402-fetch` library handles the entire flow automatically — 402 detection, EIP-3009 signing, and header attachment.

```javascript
import { wrapFetch } from "x402-fetch"; // npm install x402-fetch

const payingFetch = wrapFetch(fetch, {
  privateKey: "0x...", // EVM private key with fxUSD balance on Base
});

// x402-fetch automatically:
// 1. Detects 402 response
// 2. Signs EIP-3009 transferWithAuthorization
// 3. Retries with PAYMENT-SIGNATURE header (legacy X-PAYMENT may still be accepted)
const res = await payingFetch("https://smartclaw.xyz/api/premium");
const data = await res.json();
```

### x402-python

```python
from x402 import x402_requests  # pip install x402

# Handles 402 → EIP-3009 sign → retry automatically
response = x402_requests.get(
    "https://smartclaw.xyz/api/premium",
    private_key="0x..."
)
data = response.json()
```

### Common Mistakes

| ❌ Wrong                                    | ✅ Correct                                            |
| ------------------------------------------ | ---------------------------------------------------- |
| Direct `transfer()` of fxUSD to the wallet | Use `x402-fetch` or `x402-python` to sign and pay    |
| Sending a raw on-chain transaction         | Sign an EIP-3009 authorization (off-chain signature) |
| Manually constructing payment headers      | Let the x402 client library handle the full flow     |

### fxUSD Token Details

- **Token**: fxUSD on Base network
- **Contract**: `0x55380fe7A1910dFf29A47B622057ab4139DA42C5`
- **Decimals**: 18
- **Cost**: **$0.01 fxUSD** per premium API call

## Premium Payment Runbook (Required)

Use this flow for any automated agent integration with `GET /api/premium`.

### Fixed Payment Parameters

- **Network**: Base (`eip155:8453`)
- **Token**: fxUSD (`0x55380fe7A1910dFf29A47B622057ab4139DA42C5`)
- **Price**: `10000000000000000` wei (`0.01 fxUSD`)
- **Payee**: `0x86481e36b976bf44c71f35c7d4e5484250cdb279`

### Standard State Machine

1. `GET https://smartclaw.xyz/api/premium` with `Accept: application/json`
2. If status is `402`, parse `payment-required` (header first, body fallback)
3. Create EIP-3009 authorization and sign it with an EVM signer
4. Retry the same URL with the payment header generated by an x402 client
5. If status is `200` and body is `{}` or empty, retry once with latest cookie/headers
6. Success is valid **only** if JSON includes all fields:
   - `x402Version`
   - `protocol`
   - `topByPnl`
   - `topByRoi`
   - `generatedAt`

### Required Debug Output

For each request attempt, log:

- HTTP `status`
- `content-type`
- `set-cookie`
- `payment-required`
- `payment-response` and/or `x-payment-response`
- Response body

## Signer Strategy

### Tier 1 (Default): Local EVM Signer

Use a local signer (`viem` + private key) as the default for reliability.

### Tier 2 (Optional): External Signer Adapter

External signers may be used only if signatures are accepted on-chain for fxUSD EIP-3009.

If payment fails with `simulation_failed` or `FiatTokenV2: invalid signature`, immediately fallback to Tier 1.

## Wallet Bootstrap (When No Wallet Exists)

If the agent has no private key configured:

1. Generate wallet key file without printing key contents:

```bash
npx @alchemy/x402 wallet generate | jq -r .privateKey > wallet-key.txt
```

2. Prevent accidental git commit:

```bash
echo "wallet-key.txt" >> .gitignore
chmod 600 wallet-key.txt
```

3. Print safe public address for funding:

```bash
npx @alchemy/x402 wallet import --private-key ./wallet-key.txt
```

4. Ask user to fund Base fxUSD to that address, then re-run payment flow.

Never print private key contents in logs or chat output.

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
