# PropNest Web 🏠

The frontend for PropNest — a property management admin dashboard for managing properties, tenants, and users. Built with Next.js (App Router) and TypeScript.

This is the companion frontend to [`propnest-api`](https://github.com/gigahertz18/propnest-api), the FastAPI backend that's the primary showcase of this project. This repo exists to prove the API is real and consumable end-to-end — it's intentionally scoped for functionality over visual polish.

---

## Why this project

Built to demonstrate a working full-stack slice on top of the backend: authenticated admin views, server-side data fetching against a real API, and a typed component layer using shadcn/ui — rather than just a static UI mockup.

Parts of this project were built with AI assistance, primarily around component scaffolding and styling. The data flow, auth handling, and API integration are my own.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | shadcn/ui, Tailwind CSS |
| Auth | Session-based, enforced via Next.js middleware |
| Testing | Jest, React Testing Library |
| Linting / Formatting | ESLint, Prettier |
| Containerization | Docker (multi-stage: dev / builder / production) |
| CI | GitHub Actions |

---

## Architecture

```
src/
├── app/
│   ├── api/             # Next.js API routes — act as a thin BFF layer in front of the FastAPI backend
│   ├── admin/           # Admin dashboard pages (properties, users)
│   ├── dashboard/        # Authenticated landing page
│   └── login/            # Auth entry point
├── components/
│   ├── layout/           # Nav, logout
│   └── ui/                # shadcn/ui-based components + custom (PropertyForm, UserForm, ImageUploadZone)
├── context/              # AuthContext — client-side auth state
├── lib/
│   ├── api/               # Server-side fetch wrappers calling the FastAPI backend
│   └── auth/               # Session helpers
└── middleware.ts          # Route protection
```

**Why API routes as a BFF layer:** the Next.js API routes under `app/api/` call the FastAPI backend server-side (via `BACKEND_URL`, never exposed to the browser), so the backend's actual URL and any server-only credentials never reach the client. The browser only ever talks to Next.js itself.

**Auth:** session state is enforced centrally in `middleware.ts`, with `AuthContext` mirroring that state on the client for UI decisions (e.g. nav visibility) — the middleware, not the client context, is the actual gate.

---

## Getting Started

Requires Docker and Docker Compose. Needs `propnest-api` running separately (see that repo's README) — by default this expects it reachable at `http://localhost:8000`.

```bash
git clone https://github.com/gigahertz18/propnest-web.git
cd propnest-web
make up
```

The app will be available at `http://localhost:3000`.

To point at a backend running somewhere other than `localhost:8000`:
```bash
BACKEND_URL=http://your-backend-host:8000 make up
```

---

## Testing & Quality

```bash
make test-fe        # run tests
make test-fe-watch   # watch mode
make test-fe-cov     # with coverage
make lint-fe          # ESLint
make format-fe        # Prettier --check
```

Tests cover API route handlers, key components (forms, auth context, nav), and the server-side API client wrappers.

Every push and PR runs through CI: secret scanning (gitleaks) → lint → format check → tests. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## License

MIT (or update to your preference)
