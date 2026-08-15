# Owner Portal — Frontend Feature Specification

**Status:** Planned / Phase 3+

## Audience

Property owners.

The backend roadmap requires property-scoped authorization and a read-only experience. fileciteturn5file5

## Core navigation

```text
Owner Dashboard
  ├─ Properties
  ├─ Contracts
  ├─ Payments
  ├─ Receipts
  ├─ Income
  └─ Occupancy
```

## Read-only requirement

No owner UI should expose:

- create
- edit
- delete
- administrative role management

The absence of buttons is not the security mechanism; backend permission remains authoritative.

## Property scope

Every view must be scoped to the authenticated owner.

Never load a broad collection and filter it purely in the browser.

## Acceptance criteria

- Owner sees only linked properties.
- Owner can inspect supported financial and occupancy data.
- Owner cannot access manager/admin mutation flows.
- Cross-property data leakage is impossible through client-side navigation.

## Tests

- route access
- scoped data
- read-only UI
- unauthorized property
- navigation restrictions
