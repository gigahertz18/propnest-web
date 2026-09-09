/**
 * lib/api/dashboard.ts
 *
 * Client-side dashboard API — calls the Next.js Route Handler.
 * Safe to import in client components.
 */

import type { DashboardSummary } from "@/types/dashboard"
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

export const dashboardApi = {
  get: (): Promise<DashboardSummary> => apiFetch<DashboardSummary>("/api/dashboard"),
}
