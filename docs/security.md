# PropNest Frontend — Security

## 20. Security Design

Current security design principles:

### 20.1 Token protection

Access tokens are held in HTTP-only cookies.

### 20.2 Server-side backend access

FastAPI credentials/API URLs are handled server-side.

### 20.3 Backend authorization remains authoritative

Frontend role checks improve UX but must never be relied upon for authorization.

### 20.4 Secure cookie behavior

Production cookies use `secure=true`.

### 20.5 Same-origin application API

Browser requests use `/api/...`, reducing the need for browser-side cross-origin API access.

### 20.6 Secret scanning

CI runs gitleaks against the repository.

---


Frontend role checks are for UX only. Backend authorization remains the security boundary.
