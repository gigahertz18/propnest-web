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
import { ApiError } from "@/types"
import { extractDetail } from "@/lib/api/utility"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000"
const API_PREFIX = "/api/v1"

/**
 * FastAPI's 422 `detail` array carries a `loc` (e.g. ["body", "reference_number"])
 * pinpointing which field a validation error belongs to. `extractDetail` above
 * discards `loc` in favor of one flattened message string; this reads it back out
 * so a field-specific error (e.g. a bad reference_number) can be routed to that
 * field in the UI instead of only a generic toast.
 */
function extractFieldErrors(body: unknown): Record<string, string> | undefined {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (!Array.isArray(detail)) return undefined

  const fieldErrors: Record<string, string> = {}
  for (const entry of detail) {
    if (!entry || typeof entry !== "object" || !("loc" in entry) || !("msg" in entry)) continue
    const loc = (entry as { loc: unknown }).loc
    if (!Array.isArray(loc) || loc.length === 0) continue
    const field = String(loc[loc.length - 1])
    fieldErrors[field] = String((entry as { msg: unknown }).msg)
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
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
    let fieldErrors: Record<string, string> | undefined
    try {
      const body = await res.json()
      detail = extractDetail(body, detail)
      fieldErrors = extractFieldErrors(body)
    } catch {
      /* non-JSON response */
    }
    throw new ApiError(res.status, detail, fieldErrors)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function backendListPayments(token: string): Promise<Payment[]> {
  const page = await backendFetch<{ items: Payment[]; total: number }>("/payments/", {
    method: "GET",
    token,
  })
  return page.items
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
