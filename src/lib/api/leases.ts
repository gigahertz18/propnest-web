/**
 * lib/api/leases.ts
 *
 * Client-side lease API — calls Next.js Route Handlers.
 * Safe to import in client components.
 */

import type { Lease, LeaseCreatePayload, LeaseUpdatePayload } from "@/types/lease"
import { ApiError } from "@/types"
import { extractDetail } from "@/lib/api/utility"

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`
    try {
      const body = await res.json()
      detail = extractDetail(body, detail)
    } catch {
      /* non-JSON response */
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const leasesApi = {
  list: (): Promise<Lease[]> => apiFetch<Lease[]>("/api/leases"),

  get: (id: string): Promise<Lease> => apiFetch<Lease>(`/api/leases/${id}`),

  create: (payload: LeaseCreatePayload): Promise<Lease> =>
    apiFetch<Lease>("/api/leases", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: LeaseUpdatePayload): Promise<Lease> =>
    apiFetch<Lease>(`/api/leases/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (id: string): Promise<void> => apiFetch<void>(`/api/leases/${id}`, { method: "DELETE" }),
}
