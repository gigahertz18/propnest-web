/**
 * lib/api/leases.ts
 *
 * Client-side lease API — calls Next.js Route Handlers.
 * Safe to import in client components.
 */

import type { Lease, LeaseCreatePayload, LeaseUpdatePayload } from "@/types/lease"
import { apiFetch } from "@/lib/api/shared/apiFetch"

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
