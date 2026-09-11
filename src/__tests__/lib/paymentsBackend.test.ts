/**
 * Tests for lib/api/paymentsBackend.ts
 *
 * Covers the server-side calls to FastAPI payment endpoints. Detail/
 * fieldErrors extraction and timeout behavior (including the loc→fieldErrors
 * mapping that used to be paymentsBackend-only) are shared by every
 * *Backend.ts module and are covered once in shared/backendFetch.test.ts
 * rather than duplicated here.
 */

import {
  backendListPayments,
  backendGetPayment,
  backendCreatePayment,
  backendUpdatePayment,
  backendDeletePayment,
  backendCorrectPayment,
} from "@/lib/api/paymentsBackend"
import type { Payment, PaymentCreatePayload } from "@/types/payment"

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

const createPayload: PaymentCreatePayload = {
  contract_id: "contract-uuid-1",
  billing_record_id: "billing-uuid-1",
  amount: "15000.00",
}

const mockPayment: Payment = {
  id: "payment-uuid-1",
  contract_id: "contract-uuid-1",
  billing_record_id: "billing-uuid-1",
  amount: "15000.00",
  paid_at: "2026-01-05T00:00:00Z",
  payment_method: "gcash",
  status: "PAID",
  reference_number: "REF-001",
  corrects_payment_id: null,
  created_at: "2026-01-05T00:00:00Z",
  updated_at: "2026-01-05T00:00:00Z",
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe("paymentsBackend CRUD", () => {
  it("backendListPayments unwraps {items,total} into an array and injects the auth header", async () => {
    mockFetch.mockReturnValue(mockResponse({ items: [mockPayment], total: 1 }))
    const result = await backendListPayments("my-token")
    expect(result).toEqual([mockPayment])
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/payments/"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer my-token" }),
      })
    )
  })

  it("backendGetPayment fetches a single payment by id", async () => {
    mockFetch.mockReturnValue(mockResponse(mockPayment))
    const result = await backendGetPayment("token", "payment-uuid-1")
    expect(result).toEqual(mockPayment)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/payments/payment-uuid-1"),
      expect.any(Object)
    )
  })

  it("backendCreatePayment POSTs the payload", async () => {
    mockFetch.mockReturnValue(mockResponse(mockPayment, 201))
    const result = await backendCreatePayment("token", createPayload)
    expect(result).toEqual(mockPayment)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/payments/"),
      expect.objectContaining({ method: "POST", body: JSON.stringify(createPayload) })
    )
  })

  it("backendUpdatePayment PATCHes the payload", async () => {
    const updated = { ...mockPayment, status: "VOIDED" as const }
    mockFetch.mockReturnValue(mockResponse(updated))
    const result = await backendUpdatePayment("token", "payment-uuid-1", { status: "VOIDED" })
    expect(result).toEqual(updated)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/payments/payment-uuid-1"),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "VOIDED" }) })
    )
  })

  it("backendDeletePayment resolves without a body on 204", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error("no body")),
      } as Response)
    )
    await expect(backendDeletePayment("token", "payment-uuid-1")).resolves.toBeUndefined()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/payments/payment-uuid-1"),
      expect.objectContaining({ method: "DELETE" })
    )
  })

  it("backendCorrectPayment POSTs the correction payload", async () => {
    const correction = { amount: "14000.00", paid_at: "2026-01-06T00:00:00Z" }
    const corrected = {
      ...mockPayment,
      id: "payment-uuid-2",
      corrects_payment_id: "payment-uuid-1",
    }
    mockFetch.mockReturnValue(mockResponse(corrected, 201))
    const result = await backendCorrectPayment("token", "payment-uuid-1", correction)
    expect(result).toEqual(corrected)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/payments/payment-uuid-1/corrections"),
      expect.objectContaining({ method: "POST", body: JSON.stringify(correction) })
    )
  })
})
