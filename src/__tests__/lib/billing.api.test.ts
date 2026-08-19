/**
 * Tests for lib/api/billing.ts
 *
 * Covers the client-side billingApi that calls Next.js Route Handlers.
 * All fetch calls are mocked — we're testing the client logic, not the network.
 */

import { billingApi } from "@/lib/api/billing"
import { ApiError } from "@/types"
import type { BillingRecord, BillingRecordGeneratePayload } from "@/types/billing"

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

const mockBillingRecord: BillingRecord = {
  id: "billing-uuid-1",
  lease_id: "lease-uuid-1",
  period_start: "2026-01-01",
  period_end: "2026-01-31",
  due_date: "2026-01-05",
  amount_due: "15000.00",
  late_fee_applied: false,
  late_fee_amount_charged: null,
  status: "pending",
  overpaid_amount: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const generatePayload: BillingRecordGeneratePayload = {
  lease_id: "lease-uuid-1",
}

beforeEach(() => {
  mockFetch.mockReset()
})

// ─── list / get ─────────────────────────────────────────────────────────────

describe("billingApi.list", () => {
  it("GETs /api/billing?lease_id=", async () => {
    mockFetch.mockReturnValue(mockResponse([mockBillingRecord]))
    const result = await billingApi.list("lease-uuid-1")
    expect(result).toEqual([mockBillingRecord])
    expect(mockFetch).toHaveBeenCalledWith("/api/billing?lease_id=lease-uuid-1", expect.any(Object))
  })
})

describe("billingApi.get", () => {
  it("GETs /api/billing/:id", async () => {
    mockFetch.mockReturnValue(mockResponse(mockBillingRecord))
    const result = await billingApi.get("billing-uuid-1")
    expect(result).toEqual(mockBillingRecord)
    expect(mockFetch).toHaveBeenCalledWith("/api/billing/billing-uuid-1", expect.any(Object))
  })

  it("throws ApiError on 404 when the billing record doesn't exist", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Billing record not found" }, 404))
    await expect(billingApi.get("missing")).rejects.toThrow(ApiError)
  })
})

// ─── generate ─────────────────────────────────────────────────────────────────

describe("billingApi.generate", () => {
  it("POSTs the payload to /api/billing/generate", async () => {
    mockFetch.mockReturnValue(mockResponse(mockBillingRecord, 201))
    await billingApi.generate(generatePayload)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/billing/generate",
      expect.objectContaining({ method: "POST", body: JSON.stringify(generatePayload) })
    )
  })

  it("returns the generated billing record", async () => {
    mockFetch.mockReturnValue(mockResponse(mockBillingRecord, 201))
    const result = await billingApi.generate(generatePayload)
    expect(result).toEqual(mockBillingRecord)
  })

  it("throws ApiError on 409 when a record for the period already exists", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ detail: "Billing record already generated for this period" }, 409)
    )
    await expect(billingApi.generate(generatePayload)).rejects.toThrow(ApiError)
  })
})

// ─── evaluateOverdue ────────────────────────────────────────────────────────────

describe("billingApi.evaluateOverdue", () => {
  it("POSTs to /api/billing/:id/evaluate-overdue", async () => {
    const overdue = { ...mockBillingRecord, status: "overdue" as const }
    mockFetch.mockReturnValue(mockResponse(overdue))
    await billingApi.evaluateOverdue("billing-uuid-1")
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/billing/billing-uuid-1/evaluate-overdue",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("appends an as_of query param when provided", async () => {
    mockFetch.mockReturnValue(mockResponse(mockBillingRecord))
    await billingApi.evaluateOverdue("billing-uuid-1", "2026-02-01")
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/billing/billing-uuid-1/evaluate-overdue?as_of=2026-02-01",
      expect.any(Object)
    )
  })

  it("returns the updated billing record with its resulting status", async () => {
    const overdue = { ...mockBillingRecord, status: "overdue" as const }
    mockFetch.mockReturnValue(mockResponse(overdue))
    const result = await billingApi.evaluateOverdue("billing-uuid-1")
    expect(result.status).toBe("overdue")
  })

  it("throws ApiError on 404 when the billing record doesn't exist", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Billing record not found" }, 404))
    await expect(billingApi.evaluateOverdue("missing")).rejects.toThrow(ApiError)
  })
})

// ─── detail type-space edge cases (shared extractDetail behavior) ─────────────

describe("billingApi detail extraction", () => {
  it("joins FastAPI's structured 422 validation error array by msg", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        { detail: [{ loc: ["body", "lease_id"], msg: "field required", type: "missing" }] },
        422
      )
    )
    try {
      await billingApi.generate(generatePayload)
      throw new Error("expected billingApi.generate to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("field required")
    }
  })

  it("falls back to the generic message when detail is missing entirely", async () => {
    mockFetch.mockReturnValue(mockResponse({}, 500))
    try {
      await billingApi.generate(generatePayload)
      throw new Error("expected billingApi.generate to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })
})
