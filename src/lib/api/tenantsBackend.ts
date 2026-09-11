/**
 * lib/api/tenantsBackend.ts
 *
 * Server-side calls to FastAPI tenant endpoints.
 * Only used in Route Handlers — never imported in client components.
 */

import type { Tenant, TenantCreatePayload, TenantUpdatePayload } from "@/types/tenant"
import { backendFetch, backendFetchList } from "@/lib/api/shared/backendFetch"

export async function backendListTenants(token: string): Promise<Tenant[]> {
  return backendFetchList<Tenant>("/tenants/", { method: "GET", token })
}

export async function backendGetTenant(token: string, id: string): Promise<Tenant> {
  return backendFetch<Tenant>(`/tenants/${id}`, { method: "GET", token })
}

export async function backendCreateTenant(
  token: string,
  payload: TenantCreatePayload
): Promise<Tenant> {
  return backendFetch<Tenant>("/tenants/", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  })
}

export async function backendUpdateTenant(
  token: string,
  id: string,
  payload: TenantUpdatePayload
): Promise<Tenant> {
  return backendFetch<Tenant>(`/tenants/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  })
}

export async function backendDeleteTenant(token: string, id: string): Promise<void> {
  return backendFetch<void>(`/tenants/${id}`, { method: "DELETE", token })
}
