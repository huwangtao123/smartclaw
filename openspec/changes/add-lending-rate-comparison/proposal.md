## Why
We need a dedicated, interactive comparison of Aave USDC borrow rates versus CRVUSD WBTC+WETH average that works both online (DefiLlama/Curve APIs) and offline (CSV fallback) with up to 1-day data latency.

## What Changes
- Add a lending rate capability that normalizes dual data sources (DefiLlama/Curve + offline CSV/JSON) with automatic failover and daily freshness (≤24h staleness).
- Expose a reusable server module and `/api/rates` endpoint delivering normalized series with moving averages and source metadata.
- Ship a new `/rates` page with an interactive chart (raw + MA, range toggles, legend/tooltip) matching existing bilingual styling.
- Include error/empty states, data timestamp display, and configurable MA window (default 30d) consistent with current UI patterns.

## Impact
- Affected specs: lending-rates.
- Affected code: new `lib/rates` module, `app/api/rates/route.ts`, `app/rates/page.tsx`, `app/components/InterestRateChart`.
- External dependencies: DefiLlama/Curve rate APIs (primary), local CSV/JSON snapshots (fallback), server-side caching.
