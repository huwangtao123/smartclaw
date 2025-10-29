## Why
Premium subscribers want to act on whale trades instantly, not just observe them. Currently they copy address data manually into external tools, which is slow and error-prone. Providing an in-app copy-trade workflow keeps them inside the dashboard, drives premium conversions, and differentiates us from passive analytics portals.

## What Changes
- Introduce a premium-only copy-trade modal on the premium leaderboard that mirrors an observed whale limit order (side, size, price, token pair).
- Add a secure backend endpoint that signs and forwards the order request to the f(x) Protocol trading service on behalf of the authenticated premium user.
- Surface real-time status feedback (success, queued, failure) so users know whether their mirrored order was accepted.
- Audit and extend middleware so copy-trade actions remain gated behind the x402 premium paywall and logged for compliance.

## Impact
- UI: new copy-trade controls and modal on premium page, plus user messaging for order submission states.
- API: new premium-protected route that validates payloads, checks premium cookie, and relays to the f(x) Protocol execution endpoint.
- Integration: add service client for the f(x) Protocol limit-order API, securing credentials and mapping responses to our UI.
- Ops/Security: ensure environment variables for API keys/secrets are configured; log order attempts for auditing without exposing sensitive payloads.
