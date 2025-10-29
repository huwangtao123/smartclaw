# Project Context

## Purpose
Provide near real-time intelligence on f(x) Protocol trading performance. The public dashboard highlights market-wide momentum, while the premium area packages deeper wallet analytics behind a x402-enabled $1 USDC paywall.

## Tech Stack
- Next.js 15 App Router with React 19 and TypeScript (server components by default, selective `"use client"` islands)
- Tailwind CSS 4 (via `@tailwindcss/postcss`) for styling and theming
- Biome 2 for linting/formatting (`npm run lint`, `npm run format`)
- x402 Next middleware + `viem` for crypto-aware payments and wallet typing
- Python helper script (`dashboardAPI.py`) for offline ingestion/backfills of leaderboard CSV snapshots

## Project Conventions

### Code Style
- TypeScript everywhere; favour explicit return types on exported functions that cross module boundaries.
- Biome enforces 2-space indentation, import sorting, and the default recommended React/Next lint rules.
- Use PascalCase for React components, camelCase for helpers, and colocate derived types in `lib/types.ts`.
- Tailwind utility classes drive styling—prefer semantic component wrappers over ad-hoc inline styles.

### Architecture Patterns
- App Router with server components orchestrating data fetches (`dynamic = "force-dynamic"` keeps responses fresh).
- `lib/updateData.ts` hits the f(x) leaderboard API, normalises rows, and materialises CSV files (`fx_leaderboard_full.csv`, `fx_leaderboard_filtered.csv`) reused across routes.
- Metrics and parsing live in `lib/` modules so both pages and API routes can reuse the same calculations without duplication.
- Premium access is enforced through `middleware.ts`, which wraps x402's payment middleware, signs HMAC cookies, and normalises responses for both `/premium` and `/api/premium`.
- Client components render interactive affordances (language toggle, charts) while keeping heavy data work on the server.

### Testing Strategy
- No automated tests today; rely on targeted manual verification:
  - Run `npm run lint` before pushing.
  - Exercise `npm run dev` locally and confirm `/`, `/premium`, `/api/top-pnl`, and `/api/openapi` behave as expected.
  - Use `curl` or REST clients to validate API responses after data refreshes.
- When adding new behaviour, prefer lightweight unit tests (Vitest) or request/response assertions under `app/api/` if coverage gaps become risky.

### Git Workflow
- Default branch is `main`. Create short-lived feature branches and open PRs back to `main`.
- Write imperative commit messages that describe intent (“Add premium cookie signer”).
- Keep diffs small, run `npm run lint` (and `npm run build` if touching runtime code) before requesting review.

## Domain Context
- The dataset represents f(x) Protocol wallets, with `pnl_clean` preferred over `pnl` when available.
- Premium unlock grants access to top-10 PNL/ROI cohorts plus FX volume breakdowns; paywall state persists via an HMAC-signed cookie.
- CSV snapshots refresh on demand per request unless `SKIP_DASHBOARD_REFRESH` is set; the filtered file excludes wallets with low volume (`DASHBOARD_MIN_VOLUME` threshold).
- DeBank profile URLs (`https://debank.com/profile/{address}`) provide off-site wallet deep dives.

## Important Constraints
- Requires a Node runtime with Web Crypto support for signing premium cookies (Next.js Edge Runtime compatible).
- Environment variables:
  - `RESOURCE_WALLET_ADDRESS`, `X402_NETWORK`, `NEXT_PUBLIC_FACILITATOR_URL`, `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET` configure x402 payments.
  - `PREMIUM_ACCESS_SECRET` (required) and `PREMIUM_ACCESS_DURATION_HOURS` (default 72) control premium cookie issuance.
  - `NEXT_PUBLIC_APP_URL` is used to normalise absolute resource URLs for paywall flows.
  - `DASHBOARD_MIN_VOLUME`, `DASHBOARD_DATA_TTL_MS`, `SKIP_DASHBOARD_REFRESH` tune data refresh behaviour.
- External API quotas/latency can impact page loads because requests trigger live fetches; consider caching if rate-limited.
- CSV files are written to the project root—ensure the deployment environment allows temporary disk writes.

## External Dependencies
- f(x) Protocol leaderboard API (`https://fx.aladdin.club/LEADERBOARD_HOST/Rank/`) powers trader snapshots.
- Google Apps Script volume feed used by `lib/fxVolume.ts` for token volume trends.
- x402 payment infrastructure (`x402-next`, `x402/shared`, `x402-axios`) processes premium unlocks.
- DeBank (public) is linked for wallet inspection, though no API calls are made.
- Optional: Python stack (`requests`, `pandas`) when using `dashboardAPI.py` for batch refreshes outside Next.js.
