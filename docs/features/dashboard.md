# Dashboard — Frontend Feature Specification

**Status:** Partially implemented / Planned expansion

## Current state

The current dashboard is primarily a module/navigation surface. Properties are available while Tenants and Contracts are presented as coming-soon placeholders. fileciteturn5file13

## Phase 2 target

The dashboard becomes the operational landlord view.

Required metrics from the backend roadmap:

- Collected This Month
- Outstanding
- Late Payments
- Vacant Units
- Expiring Leases
- Recent Payments

## UX structure

Recommended page structure:

```text
Dashboard
  |
  +-- summary metric cards
  |
  +-- payment/billing attention
  |
  +-- lease/occupancy attention
  |
  +-- recent payments
```

Each metric should be independently loadable so one failing query does not blank the entire page.

## Loading

Prefer skeletons/placeholders for metric cards over a single full-page spinner.

## Empty states

Examples:

- no payments yet
- no outstanding billing
- no expiring leases
- no recent payments

Empty data should be presented as valid product state, not an error.

## Error handling

An individual aggregation failure should show an inline retryable error for that section.

## Acceptance criteria

- Dashboard communicates the current operational state within one screen.
- Metrics match backend aggregation results.
- Dates/currency are displayed consistently.
- No frontend-side reimplementation of financial aggregation logic.
- Recent payments link to payment/receipt context where the API supports it.

## Backend dependency

This feature is blocked on the backend Dashboard aggregation endpoints described in the Phase 2 roadmap. Do not invent endpoint paths until that contract is finalized.
