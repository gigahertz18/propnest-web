/**
 * lib/api/backend.ts
 *
 * Low-level client for calling the FastAPI backend.
 * Only used server-side (Route Handlers, Server Components).
 * Never import this in client components — it reads server env vars.
 */

import type { TokenResponse, CurrentUser, LoginPayload } from "@/types";
import { ApiError } from "@/types"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000"
const API_PREFIX = "/api/v1"

async function backendFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${BACKEND_URL}${API_PREFIX}${path}`, {
    ...fetchOptions,
    headers,
  })

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail ?? detail
    } catch {
      // response body wasn't JSON — use default message
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

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
