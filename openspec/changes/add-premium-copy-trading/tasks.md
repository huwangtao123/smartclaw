## 1. Implementation
- [ ] 1.1 Add premium UI affordances (copy buttons + modal) to select whale trades and configure mirror order parameters.
- [ ] 1.2 Implement server-side endpoint (`POST /api/premium/copy-trade`) that validates premium session, normalizes payload, and forwards to f(x) Protocol copy-trade API.
- [ ] 1.3 Integrate with f(x) Protocol execution client, handling signing, retries, and response mapping.
- [ ] 1.4 Emit structured audit logs for submitted orders while redacting sensitive order payload fields.

## 2. Quality
- [ ] 2.1 Add unit/integration coverage around request validation and f(x) Protocol client interactions.
- [ ] 2.2 Run `npm run lint` and applicable tests.
- [ ] 2.3 Perform manual end-to-end dry run in staging (premium user) verifying success and failure paths.
