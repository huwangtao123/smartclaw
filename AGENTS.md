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