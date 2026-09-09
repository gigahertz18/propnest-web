/**
 * lib/api/billing.ts
 *
 * Client-side billing-record API — calls Next.js Route Handlers.
 * Safe to import in client components.
 */

import type { BillingRecord, BillingRecordGeneratePayload } from "@/types/billing"
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

export const billingApi = {
  list: (leaseId: string): Promise<BillingRecord[]> =>
    apiFetch<BillingRecord[]>(`/api/billing?lease_id=${leaseId}`),

  get: (id: string): Promise<BillingRecord> => apiFetch<BillingRecord>(`/api/billing/${id}`),

  generate: (payload: BillingRecordGeneratePayload): Promise<BillingRecord> =>
    apiFetch<BillingRecord>("/api/billing/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  evaluateOverdue: (id: string, asOf?: string): Promise<BillingRecord> =>
    apiFetch<BillingRecord>(`/api/billing/${id}/evaluate-overdue${asOf ? `?as_of=${asOf}` : ""}`, {
      method: "POST",
    }),
}
