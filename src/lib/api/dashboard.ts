/**
 * lib/api/dashboard.ts
 *
 * Client-side dashboard API — calls the Next.js Route Handler.
 * Safe to import in client components.
 */

import type { DashboardSummary } from "@/types/dashboard"
import { ApiError } from "@/types"

function extractDetail(body: unknown, fallback: string): string {
  // identical to billing.ts/receipts.ts — see those for rationale
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

  return res.json() as Promise<T>
}

export const dashboardApi = {
  get: (): Promise<DashboardSummary> => apiFetch<DashboardSummary>("/api/dashboard"),
}
