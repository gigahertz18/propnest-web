/**
 * lib/api/paymentsBackend.ts
 *
 * Server-side calls to FastAPI payment endpoints.
 * Only used in Route Handlers — never imported in client components.
 */

import type {
  Payment,
  PaymentCreatePayload,
  PaymentUpdatePayload,
  PaymentCorrectionPayload,
} from "@/types/payment"
import { backendFetch, backendFetchList } from "@/lib/api/shared/backendFetch"

export async function backendListPayments(token: string): Promise<Payment[]> {
  return backendFetchList<Payment>("/payments/", { method: "GET", token })
}

export async function backendGetPayment(token: string, id: string): Promise<Payment> {
  return backendFetch<Payment>(`/payments/${id}`, { method: "GET", token })
}

export async function backendCreatePayment(
  token: string,
  payload: PaymentCreatePayload
): Promise<Payment> {
  return backendFetch<Payment>("/payments/", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  })
}

export async function backendUpdatePayment(
  token: string,
  id: string,
  payload: PaymentUpdatePayload
): Promise<Payment> {
  return backendFetch<Payment>(`/payments/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  })
}

export async function backendDeletePayment(token: string, id: string): Promise<void> {
  return backendFetch<void>(`/payments/${id}`, { method: "DELETE", token })
}

export async function backendCorrectPayment(
  token: string,
  id: string,
  payload: PaymentCorrectionPayload
): Promise<Payment> {
  return backendFetch<Payment>(`/payments/${id}/corrections`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  })
}
