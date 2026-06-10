/**
 * lib/api/users.ts
 *
 * Client-side user API — calls Next.js Route Handlers.
 * Safe to import in client components.
 */

import { User, UserCreatePayload, UserUpdatePayload, ApiError } from "@/types"

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail ?? detail
    } catch { /* non-JSON response */ }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const usersApi = {
  list: (): Promise<User[]> =>
    apiFetch<User[]>("/api/users"),

  create: (payload: UserCreatePayload): Promise<User> =>
    apiFetch<User>("/api/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UserUpdatePayload): Promise<User> =>
    apiFetch<User>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (id: string): Promise<void> =>
    apiFetch<void>(`/api/users/${id}`, { method: "DELETE" }),
}
