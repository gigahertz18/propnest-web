/**
 * lib/api/leasesBackend.ts
 *
 * Server-side calls to FastAPI lease endpoints.
 * Only used in Route Handlers — never imported in client components.
 */

import type { Lease, LeaseCreatePayload, LeaseUpdatePayload } from "@/types/lease"
import { backendFetch, backendFetchList } from "@/lib/api/shared/backendFetch"

export async function backendListLeases(token: string): Promise<Lease[]> {
  return backendFetchList<Lease>("/leases/", { method: "GET", token })
}

export async function backendGetLease(token: string, id: string): Promise<Lease> {
  return backendFetch<Lease>(`/leases/${id}`, { method: "GET", token })
}

export async function backendCreateLease(
  token: string,
  payload: LeaseCreatePayload
): Promise<Lease> {
  return backendFetch<Lease>("/leases/", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  })
}

export async function backendUpdateLease(
  token: string,
  id: string,
  payload: LeaseUpdatePayload
): Promise<Lease> {
  return backendFetch<Lease>(`/leases/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  })
}

export async function backendDeleteLease(token: string, id: string): Promise<void> {
  return backendFetch<void>(`/leases/${id}`, { method: "DELETE", token })
}
