/**
 * lib/api/tenants.ts
 *
 * Client-side tenant API — calls Next.js Route Handlers.
 * Safe to import in client components.
 */

import type { Tenant, TenantCreatePayload, TenantUpdatePayload } from "@/types/tenant"
import { apiFetch } from "@/lib/api/shared/apiFetch"

export const tenantsApi = {
  list: (): Promise<Tenant[]> => apiFetch<Tenant[]>("/api/tenants"),

  get: (id: string): Promise<Tenant> => apiFetch<Tenant>(`/api/tenants/${id}`),

  create: (payload: TenantCreatePayload): Promise<Tenant> =>
    apiFetch<Tenant>("/api/tenants", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: TenantUpdatePayload): Promise<Tenant> =>
    apiFetch<Tenant>(`/api/tenants/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (id: string): Promise<void> => apiFetch<void>(`/api/tenants/${id}`, { method: "DELETE" }),
}
