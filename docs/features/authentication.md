# Authentication — Frontend Feature Specification

**Status:** Implemented

## Users

- unauthenticated visitor
- authenticated admin
- authenticated manager
- authenticated regular user

## Current implementation

The current app provides:

- `/login`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `AuthContext`
- middleware-based route protection

The login form accepts username or email plus password. The login route trims the identifier, validates the body, calls FastAPI for a token, fetches the user profile, and stores the token in an HTTP-only cookie. fileciteturn6file9turn6file5

## User flows

### Login

```text
/login
  ↓
enter identifier + password
  ↓
POST /api/auth/login
  ↓
success → /dashboard
failure → show error
```

A `next` query parameter is shown as context on the login screen when middleware redirected the user from a protected route. fileciteturn5file10

### Session rehydration

On mount, `AuthContext` calls `/api/auth/me`.

```text
loading = true
   ↓
/api/auth/me
   ├─ 200 → user
   ├─ 401 → null
   └─ network failure → null
loading = false
```

This behavior is covered by tests. fileciteturn6file7

### Logout

```text
POST /api/auth/logout
   ↓
clear user
   ↓
/login
```

## Role helpers

The current client state exposes:

- `isAdmin`
- `isManager`
- `isAtLeastManager`
- `isRegularUser`

These are convenience helpers only. Backend authorization remains authoritative.

## Acceptance criteria

- Successful login establishes the session and redirects to `/dashboard`.
- Invalid credentials display the backend error detail when available.
- Invalid JSON/body returns a user-visible error.
- Logout clears client auth state and redirects to `/login`.
- Unauthenticated access to protected application pages is redirected to `/login`.
- Auth state remains loading until rehydration completes.
- Client code never reads the auth token directly.

## Tests

Maintain tests for:

- login success/failure
- whitespace identifier
- missing credentials
- backend 401/403/500
- session rehydration
- logout
- role helpers
- `useAuth` outside provider
- middleware/redirect behavior
