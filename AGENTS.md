# AI Agent Instructions

This project exposes a set of APIs for **cross-protocol smart wallet tracking**. f(x) Protocol is the first integrated source, with Perp DEX and Meme Coin integrations coming soon. AI agents can discover and use these APIs through the following files:

## Discovery Files

- `/llms.txt` – plain-text overview of all API endpoints (source: `public/llms.txt`)
- `/.well-known/ai-plugin.json` – ChatGPT-style plugin manifest (source: `public/.well-known/ai-plugin.json`)
- `/agents.json` – agent descriptor with capabilities and auth schemes (source: `public/agents.json`)
- `/api/openapi` – full OpenAPI 3.1 spec with `operationId`s (source: `lib/openapi.ts`)

## Quick Reference

| operationId              | Endpoint                       | Auth               |
| ------------------------ | ------------------------------ | ------------------ |
| `getTopPnl`              | `GET /api/top-pnl`             | None (global)      |
| `getFxTopPnl`            | `GET /api/fx/top-pnl`          | None               |
| `getFxStatus`            | `GET /api/fx/status`           | None               |
| `getFxFxusdRate`         | `GET /api/fx/fxusd-rate`       | None               |
| `getRates`               | `GET /api/rates`               | None               |
| `getPremiumMetrics`      | `GET /api/premium`             | x402 ($0.01 fxUSD) |
| `createX402SessionToken` | `POST /api/x402/session-token` | None               |

## URL Structure

- `/api/top-pnl` — **global aggregate** across all protocols
- `/api/fx/...` — **f(x) Protocol** specific endpoints
- `/api/rates` — **cross-protocol** lending rate comparison
- `/api/perp/...` — **Perp DEX** (coming soon)
- `/api/meme/...` — **Meme Coins** (coming soon)

## Guidelines

- Read `llms.txt` first for a quick overview, then use the OpenAPI spec for full details.
- Public endpoints are safe to call automatically (`x-openai-isConsequential: false`).
- Premium endpoints require x402 fxUSD payment — only call with explicit user consent.
- When modifying API endpoints, update the discovery files to stay in sync.

## x402 Premium Hard Rules

These rules are mandatory for any agent calling `GET /api/premium`.

### Execution Rules

1. Always call the endpoint first and parse `402 payment-required` details.
2. Never send a direct token transfer to unlock premium access.
3. Use EIP-3009 signing via an x402 client flow.
4. Retry the same endpoint with payment headers.
5. If response is `200` with `{}` (or empty body), retry once with latest cookie/headers.
6. Mark success only when response includes:
   - `x402Version`
   - `protocol`
   - `topByPnl`
   - `topByRoi`
   - `generatedAt`

### Wallet and Signer Rules

- If no wallet exists, ask for explicit user confirmation before generating one, then provide the public funding address and continue.
- Default signer: local EVM signer (`viem` + private key).
- If an external signer returns invalid EIP-3009 behavior (`simulation_failed`, `invalid signature`), fallback to local signer.
- Never print private key contents in logs, stdout, or chat.

### Required Debug Fields

For every premium payment attempt, include:

- HTTP status
- `content-type`
- `set-cookie`
- `payment-required`
- `payment-response` / `x-payment-response`
- response body
