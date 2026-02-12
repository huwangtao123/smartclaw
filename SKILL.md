---
name: fx-protocol-api
description: Query f(x) Protocol trading data — fxUSD borrow rates, top PNL wallets, and cross-protocol lending rate comparisons.
---

# f(x) Protocol API

Query real-time f(x) Protocol trading intelligence from any AI agent.

## Base URL

https://alidashboard.up.railway.app

## Operations

### Get fxUSD Borrow Rate

```bash
curl "https://alidashboard.up.railway.app/api/fxusd-rate?limit=7"
```

Returns the latest fxUSD borrow APR and a historical series. Use this before opening a leveraged position.

Parameters:
- `maWindow` (int) — moving average window in days, default 30
- `limit` (int) — number of historical points to return

### Get Top PNL Wallets

```bash
curl "https://alidashboard.up.railway.app/api/top-pnl?limit=10"
```

Returns the highest-performing wallets from the f(x) Protocol leaderboard.

Parameters:
- `limit` (int, 1–100) — number of wallets to return, default 10

### Compare Lending Rates

```bash
curl "https://alidashboard.up.railway.app/api/rates"
```

Returns borrow rate data across Aave, CrvUSD, and fxUSD for side-by-side comparison.

Parameters:
- `maWindow` (int) — moving average window in days

### Get Premium Metrics (paid)

```bash
curl "https://alidashboard.up.railway.app/api/premium" -b "aicharts-premium-access=COOKIE_VALUE"
```

Returns top traders by PNL and ROI. Requires x402 payment ($0.01 USDC on Base).

## Paying for Premium Endpoints

Premium endpoints return `402 Payment Required` with x402 payment instructions. The agent needs a wallet with USDC on Base to pay automatically.

### Using x402-fetch (recommended)

Install: `npm install x402-fetch`

```javascript
import { wrapFetch } from "x402-fetch";

const payingFetch = wrapFetch(fetch, {
  privateKey: "0x...",  // Agent's EVM wallet private key (must hold USDC on Base)
});

// Automatically handles: 402 → sign USDC payment → retry request
const response = await payingFetch("https://alidashboard.up.railway.app/api/premium");
const data = await response.json();
// { x402Version: 1, topByPnl: [...], topByRoi: [...], generatedAt: "..." }
```

### Using x402-axios (alternative)

Install: `npm install x402-axios axios`

```javascript
import axios from "axios";
import { withPayment } from "x402-axios";

const client = withPayment(axios.create(), {
  privateKey: "0x...",
});

const response = await client.get("https://alidashboard.up.railway.app/api/premium");
console.log(response.data);
```

### Using x402-python

Install: `pip install x402`

```python
from x402 import x402_requests

response = x402_requests.get(
    "https://alidashboard.up.railway.app/api/premium",
    private_key="0x..."
)
print(response.json())
```

### Using curl (manual flow)

1. Call the endpoint — get a 402 with payment instructions:
   ```bash
   curl -i "https://alidashboard.up.railway.app/api/premium"
   # Returns 402 with accepts[] containing price, network, payTo address
   ```

2. Sign a USDC payment off-chain using the instructions in the 402 response.

3. Retry with the signed payment header:
   ```bash
   curl "https://alidashboard.up.railway.app/api/premium" -H "X-PAYMENT: <base64-encoded-signed-payment>"
   ```

4. On success, the premium data is returned.

### Cost

- **$0.01 USDC** per call (on Base network)

## Full OpenAPI Spec

For complete schemas and response formats:

```bash
curl "https://alidashboard.up.railway.app/api/openapi"
```

## Discovery Files

- `/llms.txt` — plain-text API overview
- `/.well-known/ai-plugin.json` — ChatGPT plugin manifest
- `/agents.json` — agent capability descriptor
