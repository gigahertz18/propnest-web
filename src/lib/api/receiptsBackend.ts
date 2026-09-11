/**
 * lib/api/receiptsBackend.ts
 *
 * Server-side calls to FastAPI receipt endpoints.
 * Only used in Route Handlers — never imported in client components.
 *
 * Receipts are append-only: POST /payments/{payment_id}/receipts is the same
 * operation whether it's the first issuance or a reprint (see
 * ReceiptService.issue_receipt in propnest-api) — it always creates a new
 * Receipt row and never mutates an existing one. There is deliberately no
 * update/delete function here to match that invariant.
 *
 * The file bytes for a receipt live in MinIO, which per
 * docs/architecture/system-overview.md is only reachable from propnest-api —
 * this Next.js server (and the browser) can't reach it directly. Rather than
 * resolving the linked Document's `file_url` and fetching it separately
 * (which requires storage credentials this app doesn't have and returns 403
 * against a private bucket), backendGetReceiptFile calls propnest-api's own
 * authenticated GET /receipts/{id}/download endpoint, which streams the
 * bytes through server-side. The Route Handler passes those bytes straight
 * through without ever exposing a storage URL to the client.
 */

import type { Receipt } from "@/types/receipt"
import { backendFetch, backendFetchRaw } from "@/lib/api/shared/backendFetch"

// GET /payments/{payment_id}/receipts returns a bare array — unlike
// contracts/payments/properties, this list is not wrapped in a
// {items,total} paginated envelope (see openapi.json's
// "Response List Receipts For Payment ... Get" schema).
export async function backendListReceiptsForPayment(
  token: string,
  paymentId: string
): Promise<Receipt[]> {
  return backendFetch<Receipt[]>(`/payments/${paymentId}/receipts`, {
    method: "GET",
    token,
  })
}

export async function backendGetReceipt(token: string, id: string): Promise<Receipt> {
  return backendFetch<Receipt>(`/receipts/${id}`, { method: "GET", token })
}

/**
 * Issue a receipt for a payment. Same call for the first receipt and every
 * subsequent reprint — the backend always appends a new row.
 */
export async function backendIssueReceipt(token: string, paymentId: string): Promise<Receipt> {
  return backendFetch<Receipt>(`/payments/${paymentId}/receipts`, {
    method: "POST",
    token,
  })
}

export interface ReceiptFile {
  bytes: ArrayBuffer
  contentType: string
  filename: string
}

function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Resolve a receipt's PDF bytes via propnest-api's own authenticated
 * GET /receipts/{id}/download endpoint. This isn't a JSON endpoint on
 * success, so it can't go through backendFetch (which always calls
 * res.json() on success) — backendFetchRaw shares the same request/timeout/
 * error handling but hands back the raw Response instead.
 */
export async function backendGetReceiptFile(
  token: string,
  receiptId: string
): Promise<ReceiptFile> {
  const res = await backendFetchRaw(`/receipts/${receiptId}/download`, { method: "GET", token })

  return {
    bytes: await res.arrayBuffer(),
    contentType: res.headers.get("content-type") ?? "application/pdf",
    filename:
      parseFilenameFromContentDisposition(res.headers.get("content-disposition")) ??
      `receipt-${receiptId}.pdf`,
  }
}
