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
7. tests

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
Tests
```

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

