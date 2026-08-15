# PropNest Frontend — API Layer

## 10. API Layer

The frontend currently has two distinct API layers.

### 10.1 Browser-facing API helpers

Examples:

```text
src/lib/api/properties.ts
src/lib/api/users.ts
```

These call the Next.js same-origin route handlers:

```text
/api/properties
/api/users
/api/auth/*
```

They are safe for client components.

### 10.2 Backend-facing API helpers

Examples:

```text
src/lib/api/backend.ts
src/lib/api/propertiesBackend.ts
src/lib/api/usersBackend.ts
```

These run server-side and call FastAPI directly.

They:

- resolve `BACKEND_URL`
- append `/api/v1`
- attach `Authorization: Bearer <token>`
- translate non-2xx responses into `ApiError`
- handle normal JSON and multipart requests

This creates a clean boundary:

```text
Client component
    |
    v
client API helper
    |
    v
Next.js Route Handler
    |
    v
server backend helper
    |
    v
FastAPI
```

---


## 11. Why the Proxy Boundary Exists

The proxy architecture provides several benefits:

### Security

The browser does not directly receive the FastAPI access token.

### Configuration isolation

The browser does not need to know the backend URL.

### Consistent authentication

Route handlers can obtain the token from the cookie and inject the `Authorization` header.

### Error normalization

Next.js can translate backend errors into stable same-origin responses.

### Future flexibility

The backend deployment location can change without requiring browser-side API URL changes.

---


## 12. Domain Typing

Domain data is represented with TypeScript types under `src/types`.

Examples include:

```text
UserRole
CurrentUser
Property
PropertyCreatePayload
PropertyUpdatePayload
```

For properties:

```ts
type PropertyStatus = "vacant" | "occupied"
```

The frontend intentionally distinguishes:

- response models
- create payloads
- update payloads

This reduces accidental mutation of server-managed fields.

---


## 13. Property Feature

The property feature currently provides:

- list
- create
- update
- delete
- image upload
- image listing
- image deletion

Image operations are routed through the document API on the backend while the frontend presents them as property images.

Current flow:

```text
Property UI
  |
  +--> properties API
  |
  +--> image API
          |
          v
      Next.js route handler
          |
          v
      document backend endpoint
```

This is a useful example of the frontend adapting backend domain boundaries into a UI-oriented feature.

---


## 14. User Management Feature

The current admin UI includes user management and a reusable `UserForm`.

The form supports:

### Create

- full name
- username
- email
- password
- role
- active state

### Edit

Only changed fields are submitted.

For example:

```text
Existing user
   |
   | change full name only
   v
PATCH payload
{ full_name: "..." }
```

This is preferable to sending an entire resource representation for partial updates.

---


## 19. Error Handling

The frontend defines `ApiError` as the common transport-level error abstraction.

API helpers:

1. inspect HTTP status
2. attempt to parse `detail`
3. create an `ApiError`
4. propagate it to the caller

Route handlers then map backend failures to HTTP responses.

Expected pattern:

```text
FastAPI error
    |
    v
backend API helper
    |
    v
ApiError
    |
    v
Next.js Route Handler
    |
    v
JSON error response
    |
    v
Client component
```

This keeps transport failures distinguishable from unexpected programming/runtime failures.

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

