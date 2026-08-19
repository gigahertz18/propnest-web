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

Done:

- generate the next N billing periods for a lease (a "periods to generate" count, default 1 —
  not a caller-picked date/month, since `propnest-api` computes each period's `period_start`
  itself: `lease.start_date` for the first record, otherwise the previous record's
  `period_end + 1 day`, so periods are always contiguous and never precede the lease's start)
- re-evaluate/refresh a billing record's overdue status and balance on demand
- billing records (persisted list/history per lease, via `GET /billing-records/`)
- current balance
- payment state
- overdue state
- partial payment

Unblocked: `propnest-api`'s `billing_records.py` (commit `e5ebb15`, "Added implementation for
list and get billing records") now also exposes `GET /billing-records/?lease_id=` (paginated
list) and `GET /billing-records/{id}`, so the billing-record history view no longer depends on
having generated/refreshed a record in the current session.

Planned:

- payment history (per billing record, surfaced alongside the lease's billing history)

## Payment UI

Done:

- record payment
- method
- reference number
- amount
- applied billing record
- resulting status (the targeted billing record is re-evaluated and its updated status shown
  immediately after a payment is recorded)

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
