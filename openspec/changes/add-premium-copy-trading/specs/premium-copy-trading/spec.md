## ADDED Requirements
### Requirement: Premium users can mirror whale limit orders
Premium members MUST be able to initiate copy trades that replicate an observed whale limit order on the f(x) Protocol.

#### Scenario: Premium user mirrors whale trade successfully
- **GIVEN** the premium page shows a whale limit order with token pair, side, size, and limit price
- **AND** the user has a valid premium access cookie
- **WHEN** the user submits a copy-trade request with adjusted size
- **AND** the request is forwarded to the f(x) Protocol execution API
- **THEN** the response status is 200
- **AND** the response body includes a JSON payload with `status: "queued" | "filled" | "partial"`
- **AND** the UI shows the acknowledgement state returned by the API
- **AND** the order attempt is recorded in audit logs with timestamp, wallet, and order identifier.

#### Scenario: Copy-trade submission is rejected
- **GIVEN** a premium user attempts to copy a whale trade
- **WHEN** the f(x) Protocol execution API returns an error (e.g. insufficient liquidity or invalid parameters)
- **THEN** the response status is 4xx or 5xx (matching upstream)
- **AND** the response body surfaces a user-friendly error message
- **AND** the UI informs the user that the copy trade failed and suggests retrying or adjusting parameters
- **AND** the failure is logged for support diagnostics.

#### Scenario: Non-premium user is blocked from copy trading
- **GIVEN** a user without a valid premium access cookie sends `POST /api/premium/copy-trade`
- **WHEN** the request is processed
- **THEN** the response status is 402
- **AND** the body matches the standard premium paywall response.
