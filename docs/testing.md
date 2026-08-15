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

