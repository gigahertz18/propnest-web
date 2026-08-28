# Dashboard — Frontend Feature Specification

**Status:** Implemented (Phase 2)

## Current state

The dashboard combines the existing role-gated navigation cards with live operational metrics sourced from propnest-api's single composed
aggregation endpoint (`GET /dashboard/`): Collected This Month, Outstanding, Late Payments, Vacant Units, Expiring Leases, and Recent
Payments. See `DashboardMetrics.tsx`, `dashboardBackend.ts`, `dashboard.ts`, and `app/api/dashboard/route.ts`.

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

The backend exposes one composed endpoint rather than one per metric, so in practice all six metrics load and error as
a single unit (see DashboardMetrics.tsx) rather than independently per card. This differs from the recommendation above,
which was written before shape was finalized.

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

A fialed fetch shows a single inline retryable error for the whole metrics block (not per-section - see note above
on the composed endpoint.)

## Acceptance criteria

- Dashboard communicates the current operational state within one screen.
- Metrics match backend aggregation results.
- Dates/currency are displayed consistently.
- No frontend-side reimplementation of financial aggregation logic.
- Recent payments link to payment/receipt context where the API supports it. **Not yet implemented:** `admin/billing/page.tsx` has no query-param-driven modal state today, so Recent Payments links to `/admin/billing` generally rather than deep-linking to a specific payment/receipt. Tracked as a separate follow-up.
- Expiring lease entries currently show a raw truncated lease ID rather than a resolved property/tenant name - the sameidentifier-surfaced-as-is tradeoff already accepted for `tenant_id` elsewhere in this app. Also tracked as a follow-up, not a defect in this change.

## Backend dependency

No longer blocked - the Phase 2 aggregation endpoint (`GET /api/v1/dashboard/`, `DashboardSummaryResponse`) is finalzied and implemented against.
