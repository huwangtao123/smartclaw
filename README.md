This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## API Access

The site exposes an OpenAPI-compliant endpoint so you can pull the latest high-performing wallets programmatically.

- `GET /api/fxusd-rate?maWindow=30` – returns the latest and historical fxUSD borrow APR (default window 30 days).
- `GET /api/top-pnl?limit=10` – returns the highest PNL wallets from the refreshed leaderboard dataset (limit 1-100, default 10).
- `GET /api/openapi` – serves the OpenAPI 3.1 document describing the available endpoints.

Every API request for leaderboard data triggers a data refresh via `dashboardAPI.py`, so responses always reflect the newest snapshot saved to `fx_leaderboard_filtered.csv`.

## Data Generation

The lending rate data can be refreshed manually using the provided Python scripts.

### Generating fxUSD Rates
The `generate_fxUSD_rates.py` script fetches funding data from The Graph and updates `lending_rates.csv` (or an output file of your choice).

```bash
# Basic usage (updates lending_rates.csv in place)
python3 scripts/generate_fxUSD_rates.py

# Specify a custom funding ID or output file
python3 scripts/generate_fxUSD_rates.py --funding-id wstETH --output custom_rates.csv
```

### Leaderboard Data
The `dashboardAPI.py` script fetches and filters the f(x) Protocol leaderboard. This is automatically run by the `/api/top-pnl` endpoint, but can also be run manually:

```bash
python3 dashboardAPI.py
```

## Automating Data Refresh

To ensure the data is always up-to-date, you can automate the refresh using a cron job or GitHub Actions.

### Using Cron (Linux/macOS)
You can set up a cron job to run the data preparation script every day at midnight.

1. Open your crontab:
   ```bash
   crontab -e
   ```
2. Add the following line (adjust path to your project):
   ```bash
   0 0 * * * cd /path/to/aicharts && npm run prepare-data
   ```

### Using GitHub Actions
If you host on GitHub, you can use the `prepare-data.yml` workflow to refresh data on a schedule. This is useful for keeping the `lending_rates.csv` committed and fresh for the production build.

---

## AI Agent Integration

This project exposes machine-readable discovery files so AI agents can find and use the API automatically:

| File             | URL                           | Purpose                                          |
| ---------------- | ----------------------------- | ------------------------------------------------ |
| `llms.txt`       | `/llms.txt`                   | Plain-text summary of all endpoints — start here |
| `ai-plugin.json` | `/.well-known/ai-plugin.json` | ChatGPT / OpenAI plugin manifest                 |
| `agents.json`    | `/agents.json`                | Wildcard agent descriptor with capabilities      |
| OpenAPI 3.1      | `/api/openapi`                | Full machine-readable spec with schemas          |

All public endpoints include `operationId` fields that agents can use as function names:
- `getFxusdRate` – fxUSD borrow APR
- `getTopPnl` – top PNL wallets
- `getRates` – cross-protocol lending rate comparison
- `getPremiumMetrics` – premium leaderboard (x402 paywall)
- `createX402SessionToken` – initiate premium checkout

### Use as an Agent Skill

The project includes a `SKILL.md` file that any OpenClaw, Claude Code, or Cursor agent can install directly. It provides natural-language instructions and `curl` examples for every endpoint.

To use it from another agent, point at the raw file:

```
# OpenClaw
openclaw skill add https://alidashboard.up.railway.app/SKILL.md

# Or copy SKILL.md into your agent's .agent/skills/ directory
```

---

## Premium Access Configuration

Premium endpoints are gated behind x402 at $0.01 USDC per call on Base network. Configure the following environment variables:

- `PREMIUM_ACCESS_SECRET` – required secret used to sign the premium-access cookie; rotate if compromised.
- `RESOURCE_WALLET_ADDRESS` – wallet address that receives payments.
- `X402_NETWORK` – blockchain network (default: `base`).

Both `/premium` and `/api/premium` use this configuration. Update your environment and restart the app after changing values.
