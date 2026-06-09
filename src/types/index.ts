// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "manager" | "user"

export interface CurrentUser {
  id: string
  username: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: "bearer"
}

export interface LoginPayload {
  identifier: string
  password: string
}

// ─── API Errors ───────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  detail: string
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail)
    this.name = "ApiError"
  }
}
