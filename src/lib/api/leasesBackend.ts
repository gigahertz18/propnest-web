/**
 * lib/api/leasesBackend.ts
 *
 * Server-side calls to FastAPI lease endpoints.
 * Only used in Route Handlers — never imported in client components.
 */

import type { Lease, LeaseCreatePayload, LeaseUpdatePayload } from "@/types/lease"
import { ApiError } from "@/types"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000"
const API_PREFIX = "/api/v1"

/**
 * `detail` is an untrusted external value — it can be any JSON type, not just
 * the string/array-of-{msg} shapes we've happened to observe (e.g. FastAPI's
 * 422 responses send an array of { loc, msg, type } validation errors).
 * Coercing an unexpected shape straight into an Error message yields
 * "[object Object]", so every JSON type is normalized to a readable string.
 */
function extractDetail(body: unknown, fallback: string): string {
  const detail = (body as { detail?: unknown } | null)?.detail

  if (typeof detail === "string") return detail
  if (typeof detail === "number" || typeof detail === "boolean") return String(detail)

  if (Array.isArray(detail)) {
    if (detail.length === 0) return fallback
    return detail
      .map((entry) => {
        if (typeof entry === "string") return entry
        if (entry && typeof entry === "object" && "msg" in entry) {
          return String((entry as { msg: unknown }).msg)
        }
        return JSON.stringify(entry)
      })
      .join("; ")
  }

  if (detail && typeof detail === "object") {
    if ("msg" in detail) return String((detail as { msg: unknown }).msg)
    return JSON.stringify(detail)
  }

  return fallback
}

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

export async function backendListLeases(token: string): Promise<Lease[]> {
  const page = await backendFetch<{ items: Lease[]; total: number }>("/leases/", {
    method: "GET",
    token,
  })
  return page.items
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
