/**
 * lib/api/dashboardBackend.ts
 *
 * Server-side call to FastAPI's dashboard aggregation endpoint.
 * Only used in Route Handlers — never imported in client components.
 */

import type { DashboardSummary } from "@/types/dashboard"
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

export async function backendGetDashboardSummary(token: string): Promise<DashboardSummary> {
  return backendFetch<DashboardSummary>("/dashboard/", { method: "GET", token })
}
