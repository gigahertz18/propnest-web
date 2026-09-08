/**
 * Tests for lib/api/paymentsBackend.ts
 *
 * Covers the server-side calls to FastAPI payment endpoints, including the
 * detail-extraction logic used when the backend returns a non-2xx response.
 * `detail` is an untrusted external value — it can be any JSON type, so
 * these cases are enumerated from the JSON type space itself rather than
 * from any one backend's observed shape.
 */

import {
  backendListPayments,
  backendGetPayment,
  backendCreatePayment,
  backendUpdatePayment,
  backendDeletePayment,
  backendCorrectPayment,
} from "@/lib/api/paymentsBackend"
import type { ApiError } from "@/types"
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

describe("paymentsBackend detail extraction", () => {
  it("uses a plain string detail as-is", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Contract not found" }, 404))
    try {
      await backendCreatePayment("token", createPayload)
      throw new Error("expected backendCreatePayment to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("Contract not found")
    }
  })

  it("joins FastAPI's structured 422 validation error array by msg", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        {
          detail: [
            { loc: ["body", "amount"], msg: "amount must be greater than 0", type: "greater_than" },
          ],
        },
        422
      )
    )
    try {
      await backendCreatePayment("token", createPayload)
      throw new Error("expected backendCreatePayment to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("amount must be greater than 0")
    }
  })

  it("falls back to the generic message when detail is null", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: null }, 500))
    try {
      await backendCreatePayment("token", createPayload)
      throw new Error("expected backendCreatePayment to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("falls back to the generic message when detail is an empty array", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: [] }, 422))
    try {
      await backendCreatePayment("token", createPayload)
      throw new Error("expected backendCreatePayment to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("422")
    }
  })

  it("stringifies a numeric detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: 42 }, 500))
    try {
      await backendCreatePayment("token", createPayload)
      throw new Error("expected backendCreatePayment to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("42")
    }
  })

  it("stringifies a boolean detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: false }, 500))
    try {
      await backendCreatePayment("token", createPayload)
      throw new Error("expected backendCreatePayment to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("false")
    }
  })

  it("joins an array of plain strings", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: ["first problem", "second problem"] }, 422))
    try {
      await backendCreatePayment("token", createPayload)
      throw new Error("expected backendCreatePayment to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("first problem; second problem")
    }
  })

  it("JSON-stringifies array entries that have no msg field", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ detail: [{ code: "E_CONFLICT", loc: ["body", "status"] }] }, 422)
    )
    try {
      await backendCreatePayment("token", createPayload)
      throw new Error("expected backendCreatePayment to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(
        JSON.stringify({ code: "E_CONFLICT", loc: ["body", "status"] })
      )
    }
  })

  it("extracts msg from a single (non-array) error object", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { msg: "single structured error" } }, 422))
    try {
      await backendCreatePayment("token", createPayload)
      throw new Error("expected backendCreatePayment to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("single structured error")
    }
  })

  it("JSON-stringifies a plain object detail with no msg field", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { code: "E_CONFLICT" } }, 409))
    try {
      await backendCreatePayment("token", createPayload)
      throw new Error("expected backendCreatePayment to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(JSON.stringify({ code: "E_CONFLICT" }))
    }
  })
})

describe("paymentsBackend field-error extraction", () => {
  it("maps a FastAPI validation error's loc to a field-keyed error on reference_number", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        {
          detail: [
            { loc: ["body", "reference_number"], msg: "must be 13 digits", type: "value_error" },
          ],
        },
        422
      )
    )
    try {
      await backendCreatePayment("token", createPayload)
      throw new Error("expected backendCreatePayment to reject")
    } catch (err) {
      expect((err as ApiError).fieldErrors).toEqual({ reference_number: "must be 13 digits" })
    }
  })

  it("leaves fieldErrors undefined when detail is a plain string", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Contract not found" }, 404))
    try {
      await backendCreatePayment("token", createPayload)
      throw new Error("expected backendCreatePayment to reject")
    } catch (err) {
      expect((err as ApiError).fieldErrors).toBeUndefined()
    }
  })
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
