# Agent Portal — Frontend Feature Specification

**Status:** Planned / Phase 4+

## Audience

Leasing agents.

## Core navigation

```text
Agent Dashboard
  ├─ Listings
  ├─ Leads
  ├─ Viewings
  ├─ Applications
  └─ Commissions
```

The exact commission workflow is intentionally deferred in the backend roadmap. fileciteturn5file5

## Scope

Reuse the scoped-permission pattern established by Owner/Tenant portals.

An agent should see only the listings/leads/work assigned to that agent or agency relationship as defined by backend policy.

## Acceptance criteria

- Agent sees only permitted records.
- Leasing actions are constrained to supported backend transitions.
- Commission data is presented but not calculated independently in the browser.
