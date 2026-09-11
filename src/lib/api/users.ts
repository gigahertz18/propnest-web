/**
 * lib/api/users.ts
 *
 * Client-side user API — calls Next.js Route Handlers.
 * Safe to import in client components.
 */

import type { User, UserCreatePayload, UserUpdatePayload } from "@/types"
import { apiFetch } from "@/lib/api/shared/apiFetch"

export const usersApi = {
  list: (): Promise<User[]> => apiFetch<User[]>("/api/users"),

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

  delete: (id: string): Promise<void> => apiFetch<void>(`/api/users/${id}`, { method: "DELETE" }),
}
