# PropNest Frontend — Phase 1 Scope

The supplied Phase 1 issues are backend issues. Frontend work is therefore derived scope.

## Collections

Planned UI:

- view collections
- create/rename collections
- add/remove documents
- view collection membership

Wait for the backend Collection contract to stabilize before committing to detailed UX.

## Payments

Planned UI should expose:

- reference number
- method
- status
- correction/reversal history

The UI must reflect backend payment immutability/correction semantics rather than silently editing historical records.

## Notifications

The backend abstraction does not require provider-specific frontend work.

Build notification UI only when a user-facing notification API exists.

## Audit Logs

Planned admin UI:

- actor
- action
- entity
- timestamp
- diff/details
- filters

## Scope principle

Phase 1 frontend work should remain intentionally small. Do not build a full UI surface merely because a backend abstraction exists.
