/**
 * lib/api/backend.ts
 *
 * Low-level client for calling the FastAPI backend.
 * Only used server-side (Route Handlers, Server Components).
 * Never import this in client components — it reads server env vars.
 */

import type { TokenResponse, CurrentUser, LoginPayload } from "@/types"
import { backendFetch } from "@/lib/api/shared/backendFetch"

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export async function backendLogin(payload: LoginPayload): Promise<TokenResponse> {
  return backendFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function backendGetMe(token: string): Promise<CurrentUser> {
  return backendFetch<CurrentUser>("/auth/me", { token })
}
