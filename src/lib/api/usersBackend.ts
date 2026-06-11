/**
 * lib/api/users.backend.ts
 *
 * Server-side calls to FastAPI user endpoints.
 * Only used in Route Handlers — never imported in client components.
 */

import type { User, UserCreatePayload, UserUpdatePayload} from "@/types";
import { ApiError } from "@/types"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000"
const API_PREFIX = "/api/v1"

async function backendFetch<T>(path: string, options: RequestInit & { token: string }): Promise<T> {
  const { token, ...fetchOptions } = options

  const res = await fetch(`${BACKEND_URL}${API_PREFIX}${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(fetchOptions.headers as Record<string, string>),
    },
  })

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail ?? detail
    } catch {
      /* non-JSON response */
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function backendListUsers(token: string): Promise<User[]> {
  return backendFetch<User[]>("/users/", { method: "GET", token })
}

export async function backendCreateUser(token: string, payload: UserCreatePayload): Promise<User> {
  return backendFetch<User>("/users/", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  })
}

export async function backendUpdateUser(
  token: string,
  id: string,
  payload: UserUpdatePayload
): Promise<User> {
  return backendFetch<User>(`/users/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  })
}

export async function backendDeleteUser(token: string, id: string): Promise<void> {
  return backendFetch<void>(`/users/${id}`, { method: "DELETE", token })
}
