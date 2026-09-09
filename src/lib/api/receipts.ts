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
