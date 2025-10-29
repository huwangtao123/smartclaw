## 1. Implementation
- [ ] 1.1 Add premium-protected route (e.g. `/api/premium/top-pnl-export`) that returns CSV with headers rank,trader,roi,pnl,pnl_clean,vol,net.
- [ ] 1.2 Reuse `updateDashboardData`, `loadFilteredTraders`, and `computeMetrics` (if needed) to populate export payload; include generated timestamp in response headers.
- [ ] 1.3 Update premium page UI with download button/link that triggers file save and handles failures gracefully.
- [ ] 1.4 Confirm middleware paywall covers the new route and adjust matcher/config if necessary.

## 2. Quality
- [ ] 2.1 Run `npm run lint`.
- [ ] 2.2 Manually verify download works with and without premium cookie (expect 402 for locked users).
