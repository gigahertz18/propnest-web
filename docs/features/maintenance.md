# Maintenance — Frontend Feature Specification

**Status:** Planned / Phase 3+

## Workflow

```text
Issue
  ↓
Assigned
  ↓
In Progress
  ↓
Complete
```

The exact status names should follow the backend enum.

## Management view

Display:

- property
- tenant/reporter
- description
- assigned person
- status
- cost
- timestamps
- attachments

## Ticket detail

Actions should reflect the user's role.

Potential capabilities:

- assign
- start repair
- complete
- attach photos/invoices
- update cost

## Tenant view

Tenant should be able to:

- create/report an issue
- upload supporting photos
- see status
- see user-facing updates

Sensitive cost/internal assignment data should not automatically be exposed to tenants.

## Acceptance criteria

- Status transitions match backend rules.
- Attachments use the existing document/upload architecture where supported.
- Role-specific actions are distinct.
- Tenant-facing data excludes internal-only fields.

## Tests

- list/detail
- lifecycle transitions
- attachments
- role-specific action visibility
- tenant scope
