# AI Agent Instructions (Smartclaw Solana)

This project exposes a set of APIs for **Solana Smart Money Intelligence**. Agents can use these APIs to discover, rank, and explain on-chain behaviors before obvious trend breakouts occur. AI agents can discover and use these APIs through the following files:

## Discovery Files

- `/llms.txt` – plain-text overview of all API endpoints
- `/.well-known/ai-plugin.json` – ChatGPT-style plugin manifest
- `/agents.json` – agent descriptor with capabilities and auth schemes
- `/api/openapi` – full OpenAPI 3.1 spec with `operationId`s

## Quick Reference (Solana Intelligence)

| operationId              | Endpoint                       | Description               | Auth               |
| ------------------------ | ------------------------------ | ------------------------- | ------------------ |
| `getSolanaOverview`      | `GET /api/solana/overview`     | Network stats             | None               |
| `getSolanaSmartMoney`    | `GET /api/solana/smart-money`  | Ranked conviction wallets | None               |
| `getSolanaTokenFlow`     | `GET /api/solana/token-flow`   | Capital flows for a token | None               |
| `getSolanaWatchlist`     | `GET /api/solana/watchlist`    | AI agent target insights  | None               |
| `getSolanaExplain`       | `GET /api/solana/explain`      | Behavior explanation text | None               |

## Guidelines

- **No Execution**: Smartclaw is an intelligence layer, not an execution engine. It assumes agents use it for read-only tracking and analysis.
- Read `llms.txt` first for a quick overview, then use the OpenAPI spec for full details.
- Public endpoints are safe to call automatically (`x-openai-isConsequential: false`).

## Legacy (Base / f(x) Protocol) Rules

The legacy cross-protocol dashboard features an x402 payment option for premium metrics. If interacting with the `GET /api/premium` route, use EIP-3009 signing via an x402 client flow. See `SKILL.md` for more details.
