## ADDED Requirements
### Requirement: Premium CSV export for top PNL wallets
Premium members MUST be able to download the latest top PNL cohort as a CSV so they can run offline analysis.

#### Scenario: Authenticated premium session downloads CSV
- **GIVEN** a request to `GET /api/premium/top-pnl-export`
- **AND** the requester presents a valid premium access cookie
- **WHEN** the leaderboard dataset refresh succeeds
- **THEN** the response status is 200
- **AND** the response has header `content-type: text/csv; charset=utf-8`
- **AND** the response has header `content-disposition: attachment; filename="top_pnl_premium.csv"`
- **AND** the response body is a CSV with headers `rank,trader,roi,pnl,pnl_clean,vol,net`
- **AND** the CSV contains the same rows as the current premium top PNL cohort
- **AND** the response includes the export timestamp in header `x-generated-at`

#### Scenario: Non-premium request is denied
- **GIVEN** a request to `GET /api/premium/top-pnl-export`
- **AND** the requester does not have a valid premium access cookie
- **WHEN** the request is processed
- **THEN** the response status is 402
- **AND** the body matches the existing premium paywall response format.
