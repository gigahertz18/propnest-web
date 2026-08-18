# Lease Management — Frontend Feature Specification

**Status:** Planned / Phase 2

## Purpose

A Lease holds long-term rental billing terms associated 1:1 with a Contract.

The backend roadmap explicitly separates Lease from Contract so Contract can remain neutral across long- and short-term rentals. A Lease must only attach to a `long_term` Contract.

## Routes

Target:

```text
/admin/leases
/admin/leases/[id]
```

Exact route naming may be adjusted to the final navigation model.

## Lease detail

Display:

- property
- tenant
- monthly rent
- due day
- billing cycle
- security deposit
- advance payment
- late-fee policy
- grace period
- renewal option
- start date
- end date
- status

## Create flow

Entry point should be the Contract context:

```text
Contract detail
  ↓
Create Lease
```

Before opening the form, the UI should verify that the Contract is eligible for a long-term Lease when that information is available.

## Form rules

Client-side validation should cover:

- required values
- positive monetary amounts
- due day within 1–31
- valid date ordering
- non-negative grace period

Calendar edge cases belong to backend rules.

## Acceptance criteria

- Only eligible contracts can start Lease creation.
- Lease fields are clearly grouped into financial terms, dates, and status.
- Save errors are actionable.
- Edit preserves server values not present in the form.
- Status is not freely editable when the backend defines transitions.

## Tests

- list/detail
- create
- validation
- edit
- long-term eligibility error
- loading/error/empty
