# Payments — Frontend Feature Specification

**Status:** Planned

## Purpose

Payment UI records and displays financial events. Historical records must follow backend correction/immutability rules.

The Phase 1 backend roadmap requires a real payment status lifecycle, a reference number, and `check` as a payment method. It also raises the explicit decision between mutating a payment versus recording a reversal/new record. fileciteturn3file0

## Payment list

Display:

- payment date
- amount
- method
- reference number
- status
- related contract/billing context

## Record payment flow

```text
Billing context
  ↓
Record Payment
  ↓
amount
method
reference
date
  ↓
submit
  ↓
backend reconciliation result
```

## Status display

The frontend should render the backend status values exactly.

Initial known conceptual states:

- `PAID`
- `VOIDED`
- `REFUNDED`

Do not hardcode additional states until the backend defines them.

## Correction flow

If the backend adopts reversal/new-record semantics:

```text
Original payment
  ↓
Void / reverse
  ↓
New corrective payment
```

The frontend must not offer generic "Edit Payment" for immutable historical data.

## Acceptance criteria

- User can record a payment against the supported target.
- Required financial fields are validated.
- Reference number is preserved exactly as entered.
- Payment status is read-only after creation unless a defined transition action exists.
- Corrections are explicit and auditable.
- Currency formatting is consistent.

## Tests

- valid payment
- missing required fields
- invalid amount
- each supported method
- status rendering
- correction/reversal flow
- backend 4xx/5xx
