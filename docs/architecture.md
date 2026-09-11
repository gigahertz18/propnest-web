# PropNest Frontend — Architecture

## 3. Architectural Goals

The frontend architecture is designed around the following principles:

1. **Keep backend credentials and API details server-side.**
2. **Use the Next.js App Router and route handlers as the browser-to-API boundary.**
3. **Keep reusable UI components independent from backend implementation details.**
4. **Centralize authentication state in `AuthContext`.**
5. **Keep backend-facing server code separate from client-side API helpers.**
6. **Prefer typed domain models and payloads over untyped request objects.**
7. **Keep the application small and avoid introducing state-management infrastructure before it is needed.**
8. **Maintain testability at component, context, API-helper, and route-handler boundaries.**

---


## 6. Runtime Architecture

The frontend is not designed as a browser-to-FastAPI direct client.

Instead, the runtime is:

```text
Browser
   |
   | same-origin request
   v
Next.js UI / Route Handlers
   |
   | server-side request with Bearer token
   v
FastAPI
   |
   +--> PostgreSQL
   |
   +--> MinIO
```

This separation is important because the browser does not need to know the FastAPI base URL or hold the access token in JavaScript-accessible storage.

The frontend's `BACKEND_URL` is server-side configuration.

---


## 7. Rendering Model

The application uses both Server Components and Client Components.

### Server Components

Server Components are used where the page can resolve data or redirects without browser interaction.

Examples:

- `src/app/page.tsx`
- `src/app/layout.tsx`
- route-level layout/page components

The root page performs server-side user lookup and redirects:

```text
GET /
 ├─ authenticated -> /dashboard
 └─ unauthenticated -> /login
```

### Client Components

Client Components are used where interactive state or browser APIs are required.

Examples:

- `AuthContext`
- `AdminNav`
- forms
- image upload UI
- interactive shadcn/Base UI components

The codebase therefore follows a practical split:

```text
Server concern
  -> Server Component / Route Handler

Interactive concern
  -> Client Component
```

---


## 15. Component Architecture

Components are currently grouped into two broad categories.

### Layout components

Examples:

```text
AdminNav
LogoutButton
```

These compose page-level application structure and session actions.

### UI components

Examples:

```text
Button
Input
Label
Select
Dialog
Table
Alert
Card
Badge
Avatar
Tooltip
...
```

The UI layer is based largely on shadcn/Base UI primitives.

Feature-specific components such as:

```text
PropertyForm
UserForm
ImageUploadZone
```

sit alongside generic UI primitives.

This is reasonable while the project remains small.

---


## 16. Styling Architecture

Styling is based on:

- Tailwind CSS 4
- CSS variables
- shadcn/Base UI component styles
- `cn()` helper using `clsx` and `tailwind-merge`

The main stylesheet defines design tokens through CSS variables.

The frontend currently mixes:

- shared CSS variables/tokens
- utility classes
- some explicit brand colors

The PropNest brand color is currently represented directly in UI classes in places such as navigation and login.

As the application grows, those brand values should eventually be promoted into shared design tokens.

---


## 26. Current Frontend Architecture Summary

```text
                        ┌─────────────────────┐
                        │      Browser        │
                        └──────────┬──────────┘
                                   │
                         same-origin /api
                                   │
                                   v
                 ┌─────────────────────────────────┐
                 │          Next.js App             │
                 │                                 │
                 │  App Router / Server Components │
                 │  Client Components              │
                 │  Middleware                     │
                 │  Route Handlers                 │
                 │                                 │
                 │  AuthContext                    │
                 │  UI Components                  │
                 │  Client API Helpers             │
                 └────────────────┬────────────────┘
                                  │
                     server-side Bearer token
                                  │
                                  v
                 ┌─────────────────────────────────┐
                 │          FastAPI API             │
                 └────────────────┬────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    v                           v
              PostgreSQL                    MinIO
```

---


## 25. Recommended Evolution Rules

As the frontend grows, the following rules should be preserved.

### Rule 1 — Do not call FastAPI directly from client components

Client-side requests should continue to use Next.js same-origin APIs.

### Rule 2 — Do not store access tokens in localStorage

Keep the existing HTTP-only cookie model.

### Rule 3 — Do not move authorization into the frontend

Frontend role checks are for navigation and UX.

FastAPI remains the source of truth.

### Rule 4 — Keep domain API helpers typed

Avoid a generic `any`-based client.

### Rule 5 — Introduce a data-fetching library only when justified

A library such as React Query becomes useful when the UI has significant:

- cache requirements
- concurrent requests
- optimistic updates
- mutation invalidation
- background refetching

It should not be introduced solely for abstraction.

### Rule 6 — Prefer feature boundaries as complexity grows

If the frontend becomes substantially larger, evolve toward:

```text
src/features/
  auth/
  properties/
  tenants/
  contracts/
  documents/
  payments/
```

rather than allowing `components/`, `lib/`, and `types/` to become unbounded shared buckets.

---


## 27. Open Design Questions

These are not current defects; they are future architectural decisions.

1. At what feature count should domain-specific frontend feature folders be introduced?
2. When should client caching/mutation management move to React Query or a similar library?
3. Should the frontend introduce a generated TypeScript client from the FastAPI OpenAPI document?
4. Should API response types eventually be generated from backend schemas to eliminate duplication?
5. Should property images become a first-class frontend feature module instead of being embedded inside property API helpers?
6. Should role-aware navigation be centralized into a route/permission configuration?
7. Should E2E testing become part of CI once the primary user workflows stabilize? (Local Docker-based E2E now exists via `make test-e2e` — see `docs/testing.md` — but CI wiring remains deferred; it would need `propnest-api` running as a CI service container or mock.)

---


## 28. Engineering Invariants

The following should be treated as architectural invariants unless intentionally revisited:

- Access tokens are not stored in browser localStorage.
- FastAPI is not called directly by browser components.
- Backend authorization remains authoritative.
- Server-only backend helpers are never imported into client components.
- Domain payloads remain typed.
- Route handlers normalize backend transport behavior.
- Tests isolate frontend code from the real backend unless an explicit integration/E2E test requires otherwise.
- Secrets and environment-specific configuration are not committed to source control.

