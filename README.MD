# PropNest Web 🏠

The frontend for PropNest — a property management app for tracking leases, tenants, contracts, and payment records.

This is the companion UI for [`propnest-api`](#), kept intentionally lean: enough to exercise the API end-to-end (auth, properties, tenants, contracts, documents) without being the focus of the portfolio. The backend is where the architectural depth lives.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Testing | Jest, React Testing Library |
| Linting / Formatting | ESLint, Prettier |
| Containerization | Docker (multi-stage: dev / builder / production) |
| CI | GitHub Actions |

---

## How it talks to the backend

Server-side requests proxy to the API through a single `BACKEND_URL` environment variable rather than calling the API directly from the browser — keeping API URLs and auth handling server-side. Default fallback is `http://localhost:8000` for local non-Docker development.

---

## Getting Started

Requires Docker, or Node 22+ if running natively.

**With Docker** (recommended — handles shadcn/ui component setup automatically on first run):
```bash
git clone https://github.com/gigahertz18/propnest-web.git
cd propnest-web
make up
```
The app will be available at `http://localhost:3000`.

By default this points at `http://host.docker.internal:8000`, so it works out of the box if [`propnest-api`](#) is running standalone on your host. Override with your own `BACKEND_URL` if the API is deployed elsewhere:
```bash
BACKEND_URL=https://your-api-url make up
```

**Without Docker:**
```bash
npm ci
npm run dev
```

---

## Testing & Quality

```bash
make test-fe       # Jest
make lint-fe       # ESLint
make format-fe     # Prettier --check
```

Every push and PR runs through CI: secret scanning (gitleaks) → lint → format check → tests. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## License

MIT (or update to your preference)
