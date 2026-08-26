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
 * A ReceiptResponse only carries a `document_id`, not a file. The file bytes
 * live in MinIO, which per docs/architecture/system-overview.md is only
 * reachable from propnest-api — the browser (and this Next.js server) can't
 * reach it directly except via whatever `file_url` propnest-api hands back
 * on the linked Document. backendGetReceiptFile composes receipt → document
 * → file into one server-side fetch so the Route Handler can pass the bytes
 * straight through without ever exposing the storage URL to the client.
 */

import type { Receipt } from "@/types/receipt"
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

interface DocumentFile {
  file_name: string
  file_type: string
  file_url: string
}

export interface ReceiptFile {
  bytes: ArrayBuffer
  contentType: string
  filename: string
}

/**
 * Resolve a receipt's PDF bytes: receipt → linked document → storage file.
 * Throws ApiError if any leg of that chain fails, including the final
 * storage fetch (which isn't a propnest-api call, so it doesn't go through
 * backendFetch's JSON error-detail handling).
 */
export async function backendGetReceiptFile(
  token: string,
  receiptId: string
): Promise<ReceiptFile> {
  const receipt = await backendGetReceipt(token, receiptId)
  const doc = await backendFetch<DocumentFile>(`/documents/${receipt.document_id}`, {
    method: "GET",
    token,
  })

  const fileRes = await fetch(doc.file_url)
  if (!fileRes.ok) {
    throw new ApiError(fileRes.status, "Failed to retrieve the receipt file from storage")
  }

  return {
    bytes: await fileRes.arrayBuffer(),
    contentType: fileRes.headers.get("content-type") ?? doc.file_type ?? "application/pdf",
    filename: doc.file_name || `receipt-${receipt.receipt_number}.pdf`,
  }
}
