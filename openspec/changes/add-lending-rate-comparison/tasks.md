## 1. Specification
- [ ] 1.1 Draft lending-rates spec delta with ADDED requirements and scenarios (dual source, freshness ≤24h, API contract, chart UX, bilingual copy, error states).
- [ ] 1.2 Run `openspec validate add-lending-rate-comparison --strict` and resolve issues.

## 2. Data + API
- [ ] 2.1 Implement `lib/rates` for DefiLlama/Curve fetch + offline CSV/JSON fallback + moving average + freshness metadata.
- [ ] 2.2 Add `/api/rates` endpoint returning normalized series, MA window, lastUpdated, and source.

## 3. Frontend
- [ ] 3.1 Build `InterestRateChart` client component with range/legend toggles, tooltips, MA overlays, empty/error states.
- [ ] 3.2 Create `/rates` page with bilingual intro, chart section, and data timestamp/source display aligned with site styling.

## 4. Quality
- [ ] 4.1 Add unit tests for data normalization, MA calculation, and source selection; run `npm run lint`.
