# PropNest Frontend — Deployment and CI

## 21. Deployment Architecture

Development uses Docker Compose.

```text
Developer machine
    |
    +--> frontend container
           |
           +--> Next.js dev server :3000
           |
           +--> host.docker.internal:8000
                    |
                    v
                FastAPI
```

The Dockerfile has:

- `base`
- `dev`
- `builder`
- `production`

stages.

Production uses:

```text
next.config.ts
output: "standalone"
```

so the runtime image can contain the minimal standalone server bundle.

---


## 22. CI Architecture

CI currently performs:

1. checkout
2. gitleaks scan
3. Node 22 setup
4. dependency installation
5. lint
6. formatting
7. type check (`tsc --noEmit`)
8. tests
9. production build (`next build`)

The intended quality gates are therefore:

```text
Security scan
    |
    v
Lint
    |
    v
Format
    |
    v
Type check
    |
    v
Tests
    |
    v
Build
```

Type check runs before tests since it's the cheaper failure to surface first (Jest's SWC transform strips types without checking them, so it won't catch a genuine type error on its own). Build runs last since it's the most expensive step - nopoint paying for it if an earlier, cheaper gate has already failed the PR.

---

## 23. Environment Configuration

The primary server-side runtime setting is:

```text
BACKEND_URL
```

Default local behavior points to:

```text
http://localhost:8000
```

Docker Compose defaults to:

```text
http://host.docker.internal:8000
```

The backend URL should remain server-side and should not be exposed through a `NEXT_PUBLIC_*` variable.

---
