# Frontend Feature Specifications

These documents are the implementation-level handoff layer for the PropNest frontend.

They sit between architecture and code:

```text
Architecture
    ↓
Product roadmap
    ↓
Feature specification
    ↓
Implementation
    ↓
Tests
```

## Status labels

- **Implemented** — the current frontend repository contains the feature.
- **Planned** — required by the roadmap but not currently implemented.
- **Derived** — frontend behavior inferred from the backend roadmap because the supplied issue set contains backend scope, not frontend tickets.
- **Blocked on backend** — the frontend can be designed, but implementation depends on an API/schema decision that does not yet exist.

## Shared implementation rules

1. Do not invent backend endpoints. When the backend contract is not finalized, use a placeholder API dependency section and resolve it before implementation.
2. Keep browser code behind the existing Next.js same-origin API boundary.
3. Keep authorization authoritative in FastAPI.
4. Add component/API-route tests for each new feature.
5. Prefer feature-local components and types when a capability becomes substantial.
6. Use existing shadcn/Base UI primitives before introducing another UI library.
7. Preserve the existing `ApiError` pattern for transport errors.
8. Preserve explicit loading, empty, error, success, and destructive-action states.
9. Do not silently mutate historical financial records when the backend models them as immutable/reversal-based.
10. Do not treat roadmap requirements as evidence of implemented API behavior.

## Feature spec checklist

Every implementation should answer:

- Who uses the feature?
- What route/page is involved?
- What can the user see?
- What can the user do?
- What are the loading/empty/error/success states?
- What is the API dependency?
- What local state is required?
- What tests are required?
- What is explicitly out of scope?
