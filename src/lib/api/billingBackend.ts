/**
 * lib/api/billingBackend.ts
 *
 * Server-side calls to FastAPI billing-record endpoints.
 * Only used in Route Handlers — never imported in client components.
 */

import type { BillingRecord, BillingRecordGeneratePayload } from "@/types/billing"
import { backendFetch, backendFetchList } from "@/lib/api/shared/backendFetch"

export async function backendListBillingRecords(
  token: string,
  leaseId: string
): Promise<BillingRecord[]> {
  return backendFetchList<BillingRecord>(`/billing-records/?lease_id=${leaseId}`, {
    method: "GET",
    token,
  })
}

export async function backendGetBillingRecord(token: string, id: string): Promise<BillingRecord> {
  return backendFetch<BillingRecord>(`/billing-records/${id}`, { method: "GET", token })
}

export async function backendGenerateBillingRecord(
  token: string,
  payload: BillingRecordGeneratePayload
): Promise<BillingRecord> {
  return backendFetch<BillingRecord>("/billing-records/generate", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  })
}

export async function backendEvaluateOverdue(
  token: string,
  id: string,
  asOf?: string
): Promise<BillingRecord> {
  return backendFetch<BillingRecord>(
    `/billing-records/${id}/evaluate-overdue${asOf ? `?as_of=${asOf}` : ""}`,
    { method: "POST", token }
  )
}
