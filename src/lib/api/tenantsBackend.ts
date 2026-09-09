/**
 * lib/api/tenantsBackend.ts
 *
 * Server-side calls to FastAPI tenant endpoints.
 * Only used in Route Handlers — never imported in client components.
 */

import type { Tenant, TenantCreatePayload, TenantUpdatePayload } from "@/types/tenant"
import { ApiError } from "@/types"
import { extractDetail } from "@/lib/api/utility"

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
      detail = extractDetail(body, detail)
    } catch {
      /* non-JSON response */
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function backendListTenants(token: string): Promise<Tenant[]> {
  const page = await backendFetch<{ items: Tenant[]; total: number }>("/tenants/", {
    method: "GET",
    token,
  })
  return page.items
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
