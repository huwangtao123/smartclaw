## Why
Premium subscribers want to run their own analysis on the top-performing wallets. Today we only render charts in the UI and JSON via `/api/premium`. Force-fitting CSV downloads through the JSON endpoint is awkward and blocks spreadsheets or quick sharing with teammates.

## What Changes
- Add a premium-protected API route that streams the top PNL/ROI cohort as a CSV file. Reuse the existing filtered dataset so exports match what the dashboard shows.
- Surface a "Download CSV" control on the premium page that saves `top_pnl_premium.csv` and includes generated timestamp metadata.
- Ensure the export is available only for active premium sessions (premium cookie or fresh payment).

## Impact
- Frontend: one new control on the premium page hooking into the download route.
- Backend: new API handler, reuse existing leaderboard refresh logic.
- Middleware/config: verify the new route is covered by premium paywall paths.
- Docs: note the export in changelog or premium docs.
