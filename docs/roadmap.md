# PropNest Frontend — Roadmap Alignment

## Important scope note

The supplied GitHub issue set is a **backend roadmap**.

This document maps those backend capabilities to the frontend experiences they imply. It is therefore a planning document, not evidence that these UI features already exist.

## Current frontend

Implemented today:

- login/session handling
- dashboard shell
- admin properties
- admin contracts
- admin tenants
- admin users
- property image operations
- shared UI primitives and forms
- same-origin Next.js API routes
- role-aware client state

The current repository is intentionally lean. Its README describes end-to-end exercise of authentication, properties, tenants, contracts, and documents. Contract and Tenant screens are now implemented under `/admin/contracts` and `/admin/tenants` respectively.

## Phase 1 frontend

Keep the frontend light.

Primary work:

- support Collections once the backend contract stabilizes
- expose payment metadata/status where payment views already exist
- add an audit-log viewer if the administrative endpoint is built
- provide only the notification UI needed by actual backend capabilities

Do not build provider-specific notification screens merely because the backend has introduced the abstraction.

## Phase 2 frontend

Phase 2 is the first major frontend expansion.

Required user journeys:

```text
Dashboard
   |
   +--> Properties
           |
           +--> Contract
                  |
                  +--> Lease
                         |
                         +--> Billing
                                |
                                +--> Payment
                                       |
                                       +--> Receipt
```

The frontend should make this lifecycle coherent rather than treating every backend module as an independent CRUD screen.

## Internal alpha frontend priorities

The alpha should optimize usability and correctness, not feature count.

The highest-value UX targets are:

- dashboard clarity
- fast payment recording
- easy billing-state interpretation
- obvious receipt retrieval
- safe correction/reversal flows
- useful property and tenant context

## Phase 3+ frontend

### Owner Portal

Read-only, property-scoped portal.

### Tenant Portal

Tenant-specific dashboard, lease, payment history, receipts, maintenance, and announcements.

### Maintenance

Operational ticket workflow with attachments and status.

### Leasing

End-to-end vacancy-to-lease workflow.

### Agent

Leasing-focused portal.

### Accounting

Reporting-oriented finance UI.

### Mosaic AI

Read-only natural-language query experience.

### Integrations

Provider-specific setup should be separated from core workflows.

## Frontend architectural consequence

As these capabilities grow, the current small `components/` + `lib/` structure should eventually evolve toward business-capability feature modules.

A likely direction is:

```text
src/
├── features/
│   ├── identity/
│   ├── properties/
│   ├── leasing/
│   ├── collections/
│   ├── billing/
│   ├── receipts/
│   ├── maintenance/
│   ├── owner/
│   ├── tenant/
│   ├── agent/
│   ├── accounting/
│   ├── analytics/
│   └── ai/
├── components/
│   ├── layout/
│   └── ui/
└── lib/
```

This is a target architecture, not a refactor to perform immediately.
