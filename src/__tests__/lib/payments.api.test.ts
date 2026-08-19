/**
 * Tests for lib/api/payments.ts
 *
 * Covers the client-side paymentsApi that calls Next.js Route Handlers.
 * All fetch calls are mocked — we're testing the client logic, not the network.
 */

import { paymentsApi } from "@/lib/api/payments"
import { ApiError } from "@/types"
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

function mockEmptyResponse(status = 204) {
  return Promise.resolve({
    ok: true,
    status,
    json: () => Promise.reject(new Error("No body")),
  } as Response)
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

const createPayload: PaymentCreatePayload = {
  contract_id: "contract-uuid-1",
  billing_record_id: "billing-uuid-1",
  amount: "15000.00",
}

beforeEach(() => {
  mockFetch.mockReset()
})

// ─── list ─────────────────────────────────────────────────────────────────────

describe("paymentsApi.list", () => {
  it("calls GET /api/payments", async () => {
    mockFetch.mockReturnValue(mockResponse([]))
    await paymentsApi.list()
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/payments",
      expect.objectContaining({ headers: expect.any(Object) })
    )
  })

  it("returns an array of payments", async () => {
    mockFetch.mockReturnValue(mockResponse([mockPayment]))
    const result = await paymentsApi.list()
    expect(result).toEqual([mockPayment])
  })

  it("returns empty array when no payments exist", async () => {
    mockFetch.mockReturnValue(mockResponse([]))
    const result = await paymentsApi.list()
    expect(result).toEqual([])
  })

  it("throws ApiError on 401", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(paymentsApi.list()).rejects.toThrow(ApiError)
  })
})

// ─── get ──────────────────────────────────────────────────────────────────────

describe("paymentsApi.get", () => {
  it("calls GET /api/payments/:id", async () => {
    mockFetch.mockReturnValue(mockResponse(mockPayment))
    await paymentsApi.get("payment-uuid-1")
    expect(mockFetch).toHaveBeenCalledWith("/api/payments/payment-uuid-1", expect.any(Object))
  })

  it("returns the payment", async () => {
    mockFetch.mockReturnValue(mockResponse(mockPayment))
    const result = await paymentsApi.get("payment-uuid-1")
    expect(result).toEqual(mockPayment)
  })

  it("throws ApiError on 404", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Payment not found" }, 404))
    await expect(paymentsApi.get("missing")).rejects.toThrow(ApiError)
  })
})

// ─── create ───────────────────────────────────────────────────────────────────

describe("paymentsApi.create", () => {
  it("POSTs the payload to /api/payments", async () => {
    mockFetch.mockReturnValue(mockResponse(mockPayment, 201))
    await paymentsApi.create(createPayload)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/payments",
      expect.objectContaining({ method: "POST", body: JSON.stringify(createPayload) })
    )
  })

  it("returns the created payment", async () => {
    mockFetch.mockReturnValue(mockResponse(mockPayment, 201))
    const result = await paymentsApi.create(createPayload)
    expect(result).toEqual(mockPayment)
  })

  it("throws ApiError with the validation message on 422", async () => {
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
      await paymentsApi.create({ ...createPayload, amount: "0" })
      throw new Error("expected paymentsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("amount must be greater than 0")
    }
  })
})

// ─── update ───────────────────────────────────────────────────────────────────

describe("paymentsApi.update", () => {
  it("PATCHes the payload to /api/payments/:id", async () => {
    const updated = { ...mockPayment, status: "VOIDED" as const }
    mockFetch.mockReturnValue(mockResponse(updated))
    await paymentsApi.update("payment-uuid-1", { status: "VOIDED" })
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/payments/payment-uuid-1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "VOIDED" }) })
    )
  })
})

// ─── delete ───────────────────────────────────────────────────────────────────

describe("paymentsApi.delete", () => {
  it("calls DELETE /api/payments/:id", async () => {
    mockFetch.mockReturnValue(mockEmptyResponse())
    await paymentsApi.delete("payment-uuid-1")
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/payments/payment-uuid-1",
      expect.objectContaining({ method: "DELETE" })
    )
  })

  it("resolves without a value", async () => {
    mockFetch.mockReturnValue(mockEmptyResponse())
    await expect(paymentsApi.delete("payment-uuid-1")).resolves.toBeUndefined()
  })
})

// ─── correct ──────────────────────────────────────────────────────────────────

describe("paymentsApi.correct", () => {
  it("POSTs the correction payload to /api/payments/:id/corrections", async () => {
    const correction = { amount: "14000.00", paid_at: "2026-01-06T00:00:00Z" }
    const corrected = {
      ...mockPayment,
      id: "payment-uuid-2",
      corrects_payment_id: "payment-uuid-1",
    }
    mockFetch.mockReturnValue(mockResponse(corrected, 201))
    const result = await paymentsApi.correct("payment-uuid-1", correction)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/payments/payment-uuid-1/corrections",
      expect.objectContaining({ method: "POST", body: JSON.stringify(correction) })
    )
    expect(result).toEqual(corrected)
  })
})

// ─── detail type-space edge cases (shared extractDetail behavior) ─────────────

describe("paymentsApi detail extraction", () => {
  it("falls back to the generic message when detail is missing entirely", async () => {
    mockFetch.mockReturnValue(mockResponse({}, 500))
    try {
      await paymentsApi.list()
      throw new Error("expected paymentsApi.list to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("joins an array of plain strings", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: ["first problem", "second problem"] }, 422))
    try {
      await paymentsApi.list()
      throw new Error("expected paymentsApi.list to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("first problem; second problem")
    }
  })

  it("extracts msg from a single (non-array) error object", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { msg: "single structured error" } }, 422))
    try {
      await paymentsApi.list()
      throw new Error("expected paymentsApi.list to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("single structured error")
    }
  })
})
