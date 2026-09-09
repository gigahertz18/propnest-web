/**
 * lib/api/tenants.ts
 *
 * Client-side tenant API — calls Next.js Route Handlers.
 * Safe to import in client components.
 */

import type { Tenant, TenantCreatePayload, TenantUpdatePayload } from "@/types/tenant"
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
