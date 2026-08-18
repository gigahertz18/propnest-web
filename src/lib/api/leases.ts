/**
 * lib/api/leases.ts
 *
 * Client-side lease API — calls Next.js Route Handlers.
 * Safe to import in client components.
 */

import type { Lease, LeaseCreatePayload, LeaseUpdatePayload } from "@/types/lease"
import { ApiError } from "@/types"

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
