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

- `GET /api/top-pnl?limit=10` – returns the highest PNL wallets from the refreshed leaderboard dataset (limit 1-100, default 10).
- `GET /api/openapi` – serves the OpenAPI 3.1 document describing the available endpoints.

Every API request triggers a data refresh via `dashboardAPI.py`, so responses always reflect the newest snapshot saved to `fx_leaderboard_filtered.csv`.
