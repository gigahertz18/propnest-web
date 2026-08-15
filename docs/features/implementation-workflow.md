# Frontend Developer Implementation Workflow

This is the expected workflow for implementing a new PropNest frontend feature.

## 1. Read the feature specification

Start at:

```text
docs/features/<feature>.md
```

Determine:

- status
- target users
- user flow
- acceptance criteria
- backend dependency

## 2. Read the relevant architecture document

Usually:

- `docs/architecture.md`
- `docs/api-layer.md`
- `docs/authentication.md`
- `docs/architecture/frontend-backend-contract.md`

## 3. Inspect existing neighboring code

Prefer extending existing patterns.

Examples:

- User feature → `src/app/admin/users`, `UserForm`, `usersApi`
- Property feature → `src/app/admin/properties`, `PropertyForm`, `propertiesApi`
- Auth feature → `AuthContext`, auth route handlers
- Files/images → `ImageUploadZone`, property image API

## 4. Confirm the backend contract

Before implementation, confirm:

- endpoint
- method
- request body
- response shape
- authorization
- status codes
- error shape

Do not invent a backend contract simply to unblock UI development.

## 5. Design tests first

At minimum:

- rendering
- loading
- success
- empty
- backend error
- authorization failure
- destructive action where applicable

For a substantial feature, also add route-handler/API-helper tests.

## 6. Implement

Prefer:

```text
page
  ↓
feature component
  ↓
client API helper
  ↓
Next.js route handler
  ↓
backend API
```

Do not call FastAPI directly from browser components.

## 7. Verify quality gates

Run:

```bash
make test-fe
make lint-fe
make format-fe
```

The repository CI runs secret scanning, lint, formatting, and frontend tests. fileciteturn6file14
