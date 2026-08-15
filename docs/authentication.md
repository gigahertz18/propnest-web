# PropNest Frontend — Authentication and Session Management

## 8. Authentication Architecture

Authentication is implemented through a server-managed HTTP-only cookie.

### 8.1 Token location

The access token is stored in:

```text
Cookie: pn_token
```

The cookie is configured with:

- `httpOnly`
- `secure` in production
- `sameSite=lax`
- `path=/`
- one-hour `maxAge`

The token is deliberately not exposed through the browser's JavaScript runtime.

### 8.2 Session helper

`src/lib/auth/session.ts` is the server-side session abstraction.

Responsibilities:

- read the auth cookie
- expose the token to server code
- call the backend `/auth/me` endpoint
- resolve the current user
- return `null` when there is no valid session

The frontend therefore treats the backend as the authoritative source for user identity.

### 8.3 Auth context

`src/context/AuthContext.tsx` provides client-side session state:

```text
user
loading
isAdmin
isManager
isAtLeastManager
isRegularUser
login()
logout()
```

The context rehydrates the client by calling:

```text
GET /api/auth/me
```

It does not decode the JWT itself.

### 8.4 Login flow

```text
Browser
  |
  | POST /api/auth/login
  v
Next.js route handler
  |
  | backendLogin()
  v
FastAPI /auth/login
  |
  | access token
  v
Next.js
  |
  | store pn_token HTTP-only cookie
  |
  | backendGetMe(token)
  v
FastAPI /auth/me
  |
  v
Next.js
  |
  | return current user
  v
Browser
```

### 8.5 Logout flow

```text
Browser
  |
  | POST /api/auth/logout
  v
Next.js
  |
  | clear pn_token
  v
Browser
  |
  | redirect /login
```

---


## 9. Route Protection

`src/middleware.ts` provides coarse authentication protection.

The middleware:

- allows `/login` without a token
- ignores API and Next.js internal paths
- redirects unauthenticated users to `/login`
- preserves the requested path using the `next` query parameter
- redirects authenticated users away from `/login`
- does not decode JWT roles

Current role enforcement is intentionally not performed in middleware.

The existing design instead relies on:

1. frontend page/component logic for UI-level access
2. backend authorization for actual security enforcement

This distinction is important: **frontend role checks are not security boundaries.**

The API must remain authoritative.

---

