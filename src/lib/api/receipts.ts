/**
 * lib/api/receipts.ts
 *
 * Client-side receipt API — calls Next.js Route Handlers.
 * Safe to import in client components.
 *
 * There is no update/delete here: receipts are append-only. `issue` is used
 * both for the first receipt on a payment and for every reprint — the
 * backend always creates a new record rather than mutating an existing one.
 */

import type { Receipt } from "@/types/receipt"
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

export interface DownloadedFile {
  blob: Blob
  filename: string
}

function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
  return match ? decodeURIComponent(match[1]) : null
}

export const receiptsApi = {
  listForPayment: (paymentId: string): Promise<Receipt[]> =>
    apiFetch<Receipt[]>(`/api/payments/${paymentId}/receipts`),

  get: (id: string): Promise<Receipt> => apiFetch<Receipt>(`/api/receipts/${id}`),

  issue: (paymentId: string): Promise<Receipt> =>
    apiFetch<Receipt>(`/api/payments/${paymentId}/receipts`, { method: "POST" }),

  downloadUrl: (id: string): string => `/api/receipts/${id}/download`,

  /**
   * Fetches the receipt PDF as a Blob. Unlike the JSON endpoints above, a
   * success body is raw PDF bytes while a failure body is JSON ({detail}),
   * so this can't reuse apiFetch (which assumes JSON on success). Also
   * guards against a 200 response whose body isn't actually a PDF (the
   * exact failure mode that used to silently save a JSON error as a file).
   */
  download: async (id: string, receiptNumber?: number): Promise<DownloadedFile> => {
    const res = await fetch(receiptsApi.downloadUrl(id))

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

    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.includes("application/pdf")) {
      throw new ApiError(res.status, "Received an unexpected file type from the server")
    }

    const filename =
      parseFilenameFromContentDisposition(res.headers.get("content-disposition")) ??
      `receipt-${receiptNumber ?? id}.pdf`

    return { blob: await res.blob(), filename }
  },
}
