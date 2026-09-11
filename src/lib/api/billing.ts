/**
 * lib/api/billing.ts
 *
 * Client-side billing-record API — calls Next.js Route Handlers.
 * Safe to import in client components.
 */

import type { BillingRecord, BillingRecordGeneratePayload } from "@/types/billing"
import { apiFetch } from "@/lib/api/shared/apiFetch"

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
