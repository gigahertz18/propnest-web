# Tenant Portal — Frontend Feature Specification

**Status:** Planned / Phase 3+/4

## Audience

Tenant.

The roadmap defines:

```text
dashboard
→ lease
→ receipts
→ payment history
→ maintenance
→ announcements
```

and requires tenant-scoped authorization. fileciteturn5file5

## Navigation

```text
Tenant Dashboard
  ├─ My Lease
  ├─ Payments
  ├─ Receipts
  ├─ Maintenance
  └─ Announcements
```

## Scope

All data is "my" data from the tenant perspective.

Avoid global lists that the frontend filters locally.

## Acceptance criteria

- Tenant sees only their own records.
- Lease and payment history are read-only unless an explicit action is defined.
- Receipt downloads are scoped to the tenant.
- Maintenance becomes interactive when that backend capability exists.
- Announcements are property/global scoped according to backend design.

## Tests

- tenant access
- own data
- cross-tenant access denial
- empty states
- navigation
