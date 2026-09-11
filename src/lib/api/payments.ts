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
import { apiFetch } from "@/lib/api/shared/apiFetch"

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
