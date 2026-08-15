# Leasing — Frontend Feature Specification

**Status:** Planned / Phase 4+

## Workflow

```text
Vacant
  ↓
Listing
  ↓
Inquiry
  ↓
Viewing
  ↓
Reservation
  ↓
Application
  ↓
Approval
  ↓
Lease
```

The backend roadmap explicitly says this large workflow should be split into smaller issues when the phase begins. fileciteturn5file6

## Frontend principle

Do not implement the whole flow as one mega-form.

Use distinct business stages with clear transitions.

## Candidate screens

```text
/listings
/listings/[id]
/inquiries
/viewings
/reservations
/applications
/applications/[id]
```

Exact URLs are implementation choices.

## Stage behavior

Each stage should clearly show:

- current state
- allowed next actions
- actor
- timestamps
- supporting information

## Lease creation

Approval should lead to creation of the existing Contract + Lease pair rather than duplicating rental concepts in the frontend.

## Acceptance criteria

- State transitions are backend-authoritative.
- Users cannot skip stages unless backend explicitly permits it.
- Completed application can lead to Lease creation.
- Existing Property/Contract/Lease components are reused.
