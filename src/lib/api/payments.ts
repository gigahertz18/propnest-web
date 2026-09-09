/**
 * lib/api/payments.ts
 *
 * Client-side payment API — calls Next.js Route Handlers.
 * Safe to import in client components.
 */

import type {
  Payment,
  PaymentCreatePayload,
  PaymentUpdatePayload,
  PaymentCorrectionPayload,
} from "@/types/payment"
import { ApiError } from "@/types"
import { extractDetail } from "@/lib/api/utility"

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`
    let fieldErrors: Record<string, string> | undefined
    try {
      const body = await res.json()
      detail = extractDetail(body, detail)
      fieldErrors = (body as { fieldErrors?: Record<string, string> } | null)?.fieldErrors
    } catch {
      /* non-JSON response */
    }
    throw new ApiError(res.status, detail, fieldErrors)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const paymentsApi = {
  list: (): Promise<Payment[]> => apiFetch<Payment[]>("/api/payments"),

  get: (id: string): Promise<Payment> => apiFetch<Payment>(`/api/payments/${id}`),

  create: (payload: PaymentCreatePayload): Promise<Payment> =>
    apiFetch<Payment>("/api/payments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: PaymentUpdatePayload): Promise<Payment> =>
    apiFetch<Payment>(`/api/payments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (id: string): Promise<void> =>
    apiFetch<void>(`/api/payments/${id}`, { method: "DELETE" }),

  correct: (id: string, payload: PaymentCorrectionPayload): Promise<Payment> =>
    apiFetch<Payment>(`/api/payments/${id}/corrections`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
}
