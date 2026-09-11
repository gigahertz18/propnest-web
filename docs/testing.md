# PropNest Frontend — Testing

## 17. Testing Architecture

The test suite uses:

```text
Jest
React Testing Library
jest-dom
jsdom
Node test environment for Route Handlers
```

Tests are organized by responsibility.

### Component tests

Examples:

```text
AdminNav.test.tsx
AuthContext.test.tsx
Badge.test.tsx
PropertyForm.test.tsx
UserForm.test.tsx
```

### Route Handler tests

Examples:

```text
login.route.test.ts
properties.route.test.ts
```

### API helper tests

Examples:

```text
properties.api.test.ts
users.api.test.ts
```

The tests intentionally mock boundaries rather than requiring the real FastAPI application.

This is appropriate because the frontend unit suite should verify frontend behavior independently from backend infrastructure.

---


## 18. Test Strategy

The frontend testing pyramid should remain:

```text
              E2E
          /-----------\
       Integration / API
      /-----------------\
       Component / Hook
      /-------------------\
            Unit
```

Current implementation is weighted toward:

- component tests
- context tests
- route-handler tests
- API helper tests

Future additions should focus on a small number of high-value end-to-end flows rather than large amounts of brittle E2E coverage.

Priority E2E journeys:

1. login
2. authenticated dashboard access
3. property CRUD
4. property image upload/delete
5. logout

---

## 19. End-to-End Testing (Playwright, Docker)

E2E tests run via Playwright, entirely inside Docker — no host-level browser
install, extension, or cached binaries are required.

Run with:

```bash
make test-e2e
```

This builds `docker/Dockerfile.e2e` (based on the official
`mcr.microsoft.com/playwright` image, which ships browsers pre-installed),
waits for the `frontend` service to report healthy, then runs
`npx playwright test` against it over the existing `propnest_network`.

Current coverage is a single smoke test
(`e2e/smoke.spec.ts`): an unauthenticated visit to `/` redirects to `/login`
and the login form renders. It has no backend dependency.

The 5 priority E2E journeys listed above remain future work — each requires
a running, seeded `propnest-api` backend, which this scaffold does not yet
provision.

`@playwright/test`'s version in `package.json` must stay in lockstep with the
image tag in `docker/Dockerfile.e2e` — a mismatch between the two causes a
runtime browser-version error.

