# PropNest Frontend — Phase 2 Scope

Phase 2 is the first major frontend expansion because it creates the complete rental-money workflow.

## Core journey

```text
Property
  ↓
Contract
  ↓
Lease
  ↓
Billing
  ↓
Payment
  ↓
Receipt
  ↓
Dashboard
```

## Lease UI

Done:

- lease list/detail
- create/update lease
- monthly rent
- due day
- grace period
- dates
- status
- renewal settings

A Lease should only be creatable for long-term Contracts.

## Billing UI

Planned:

- billing records
- current balance
- payment state
- overdue state
- partial payment
- payment history

## Payment UI

Planned:

- record payment
- method
- reference number
- amount
- applied billing record
- resulting status

## Receipt UI

Planned:

- receipt history
- receipt detail
- download PDF
- reprint without overwriting the original

## Dashboard UI

Planned metrics:

- Collected This Month
- Outstanding
- Late Payments
- Vacant Units
- Expiring Leases
- Recent Payments

## Phase 2 completion criterion

The frontend should support the full core workflow without requiring backend-only tooling.
