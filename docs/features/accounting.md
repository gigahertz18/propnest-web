# Landlord Accounting — Frontend Feature Specification

**Status:** Planned / Phase 4+

## Purpose

Provide landlord-specific accounting views, not a generic bookkeeping replacement.

Backend roadmap scope:

- income
- expenses
- profit
- cash flow
- security deposits
- refunds
- tax reports

fileciteturn5file17

## Navigation

```text
Accounting
  ├─ Income
  ├─ Expenses
  ├─ Profit
  ├─ Cash Flow
  ├─ Deposits
  ├─ Refunds
  └─ Tax Reports
```

## UX principles

- reporting-first
- date/range filters
- consistent currency formatting
- export only when backend supports it
- no client-side financial reconciliation

## Important constraint

Tax reporting requirements were explicitly deferred in the backend roadmap and require Philippines-specific research before implementation. Do not implement tax semantics from assumptions.

## Acceptance criteria

- Every displayed aggregate can be traced to a backend report definition.
- Date filters are explicit.
- Security-deposit lifecycle is not invented until backend models it.
