# Collections — Frontend Feature Specification

**Status:** Planned / Blocked on backend contract

## Purpose

Collections group documents and potentially other entities under a business context.

The backend roadmap explicitly says the exact scope still needs to be decided: documents only versus generalized entity references, plus the relationship to Property/Contract/Tenant. fileciteturn5file5

## Frontend should not lock the UX before that decision

The initial UI should be designed around the smallest contract:

```text
Collection
  - id
  - name
  - owning context
  - created_at
```

Only add generalized entity-management UI if the backend model explicitly supports it.

## Proposed user flows

### List collections

Within a property/contract/tenant context:

```text
Context
  ↓
Collections
  ↓
list
```

### Create collection

- name required
- cancel
- create
- success returns to list

### Rename

Inline or edit dialog.

### Open collection

Display documents belonging to the collection.

### Add/remove documents

Use existing document selection/upload patterns where supported.

## Acceptance criteria

- User can see collections within an authorized context.
- User can create and rename a collection.
- Empty collection state is explicit.
- Document membership operations reflect backend rules.
- UI does not assume generalized entities until the backend contract supports them.

## Tests

- list
- empty state
- create
- rename
- authorization error
- document membership
