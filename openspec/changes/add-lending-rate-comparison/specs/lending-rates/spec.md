## ADDED Requirements
### Requirement: Lending rate data sourcing
The system SHALL fetch Aave USDC borrow rates and CRVUSD average (WBTC+WETH) from DefiLlama/Curve official APIs as the primary source, and SHALL fall back to a local CSV/JSON snapshot when the primary source is unavailable or exceeds the allowed freshness.

#### Scenario: Primary source succeeds
- **WHEN** the primary API responds within limits
- **THEN** the system SHALL use that payload as the current series
- **AND** SHALL record the source as `primary`.

#### Scenario: Primary source fails or is stale
- **WHEN** the primary API errors or returns data older than 24 hours
- **THEN** the system SHALL load the offline CSV/JSON snapshot if present
- **AND** SHALL record the source as `fallback`
- **AND** SHALL expose an error message if neither source is available.

### Requirement: Rate normalization and moving average
The system SHALL normalize all rate points into daily UTC buckets containing Aave USDC borrow APY and CRVUSD average (WBTC+WETH) values, and SHALL compute a configurable moving average (default 30 days) for both series.

#### Scenario: Moving average computed
- **WHEN** at least N daily points (N = MA window) exist
- **THEN** the system SHALL emit `aaveMa` and `crvusdMa` fields per day using the configured window.

#### Scenario: Insufficient data for moving average
- **WHEN** fewer than N daily points exist
- **THEN** the system SHALL return raw values without MA fields for those days.

### Requirement: Rate delivery API
The system SHALL expose an HTTP endpoint at `/api/rates` that returns JSON `{ series: [{ date, aaveBorrow, crvusdAvg, aaveMa?, crvusdMa? }], maWindow, lastUpdated, source, rangeHint }` on success, and SHALL return a non-200 with an error payload when no source can be served.

#### Scenario: Successful response
- **WHEN** at least one data source is available
- **THEN** the endpoint SHALL respond 200 with normalized series, `maWindow`, `lastUpdated` (ISO string), and `source` indicating primary or fallback.

#### Scenario: No data available
- **WHEN** both primary and fallback sources are unavailable
- **THEN** the endpoint SHALL respond with an error status (e.g., 503) and a JSON error message describing the failure.

### Requirement: Rates comparison page
The system SHALL provide a public `/rates` page that presents the lending rate comparison chart with bilingual copy consistent with existing site language toggles.

#### Scenario: Default view renders
- **WHEN** data is available
- **THEN** the page SHALL render the chart with raw and moving-average lines, default MA window of 30 days, and range filters (All/1Y/6M/3M/1M).

#### Scenario: Interaction toggles
- **WHEN** a user toggles legend entries or MA visibility or selects a different range
- **THEN** the chart SHALL update the displayed series accordingly without full page reload.

#### Scenario: Empty or error state
- **WHEN** the API returns an error or empty dataset
- **THEN** the page SHALL show a clear error/empty message and suppress the chart while keeping the page layout intact.

### Requirement: UX consistency and metadata display
The system SHALL display freshness and source metadata, and SHALL maintain responsive, accessible controls consistent with the existing dashboard styling.

#### Scenario: Freshness displayed
- **WHEN** the chart renders
- **THEN** the page SHALL show the last updated timestamp and source (primary or fallback) within the chart section.

#### Scenario: Responsive and accessible controls
- **WHEN** viewed on mobile or desktop
- **THEN** chart controls (range, legend, MA toggle) SHALL remain operable via pointer and keyboard
- **AND** the chart SHALL remain scrollable or responsive without clipping.
