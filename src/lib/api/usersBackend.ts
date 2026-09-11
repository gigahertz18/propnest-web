/**
 * lib/api/users.backend.ts
 *
 * Server-side calls to FastAPI user endpoints.
 * Only used in Route Handlers — never imported in client components.
 */

import type { User, UserCreatePayload, UserUpdatePayload } from "@/types"
import { backendFetch } from "@/lib/api/shared/backendFetch"

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
