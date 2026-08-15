# PropNest Frontend — Overview

## 1. Purpose

This document describes the current software design of the PropNest web frontend.

The goal is to establish a durable engineering reference for the frontend as it evolves independently from the backend. It documents the architecture that exists today, the responsibilities of each layer, the major request and authentication flows, the testing strategy, deployment model, and known design constraints.

This is a **current-state design document**. It intentionally distinguishes existing behavior from future improvements.

---


## 2. Product Context

PropNest is a property-management application. The frontend is the web client for the PropNest API and currently provides a relatively small UI surface intended to exercise the core platform capabilities.

The current repository explicitly describes the frontend as a lean companion UI covering:

- authentication
- properties
- tenants
- contracts
- documents
- payment records

The frontend is not intended to duplicate backend business logic. Its primary responsibilities are presentation, user interaction, browser/session behavior, and controlled communication with the API.

---


## 4. Technology Stack

| Concern | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| UI runtime | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Component primitives | shadcn/ui / Base UI |
| Icons | lucide-react |
| Client utilities | clsx, tailwind-merge, class-variance-authority |
| Authentication state | React Context |
| HTTP | native `fetch` |
| Testing | Jest + React Testing Library |
| Test environment | jsdom, with Node for route-handler tests |
| Linting | ESLint |
| Formatting | Prettier + Tailwind Prettier plugin |
| Containerization | Docker |
| Local orchestration | Docker Compose |
| CI | GitHub Actions |

The repository uses Node 22 in its Docker image and CI configuration.

---


## 5. Repository Structure

Current high-level structure:

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker/
│   └── entrypoint.sh
├── src/
│   ├── __tests__/
│   │   ├── app/api/
│   │   ├── components/
│   │   └── lib/
│   ├── app/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── layout/
│   │   └── ui/
│   ├── context/
│   ├── lib/
│   │   ├── api/
│   │   └── auth/
│   ├── types/
│   └── middleware.ts
├── components.json
├── docker-compose.yml
├── Dockerfile
├── eslint.config.mjs
├── jest.config.ts
├── jest.setup.ts
├── Makefile
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.MD
└── tsconfig.json
```

The structure follows a relatively conventional Next.js feature hierarchy while keeping domain/API helpers under `src/lib`.

---


## 24. Current Design Constraints

The current frontend is intentionally small. Several design limitations are acceptable at this stage:

### 24.1 No client-side data-fetching framework

There is no React Query/SWR layer.

The app currently uses direct `fetch` calls and local component state.

### 24.2 No global state library

React Context is sufficient for the current authentication state.

### 24.3 Limited feature abstraction

Property/user APIs have specialized helpers instead of a generic data-access framework.

This is currently preferable to premature abstraction.

### 24.4 Role enforcement is split

The frontend knows roles, but the backend must remain authoritative.

### 24.5 Image/document adaptation

The UI treats documents of type `photo` as property images. This is a presentation-level mapping rather than a separate backend image domain.

---



## Roadmap status

The frontend is currently ahead only in the small set of UI capabilities needed to exercise the early backend. The backend roadmap is the authoritative feature sequence.

The complete frontend mapping is documented in [Roadmap Alignment](roadmap.md).
