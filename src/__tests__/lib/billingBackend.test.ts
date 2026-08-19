/**
 * Tests for lib/api/billingBackend.ts
 *
 * Covers the server-side calls to FastAPI billing-record endpoints,
 * including the detail-extraction logic used when the backend returns a
 * non-2xx response. `detail` is an untrusted external value — it can be any
 * JSON type, so these cases are enumerated from the JSON type space itself
 * rather than from any one backend's observed shape.
 */

import {
  backendGenerateBillingRecord,
  backendEvaluateOverdue,
  backendListBillingRecords,
  backendGetBillingRecord,
} from "@/lib/api/billingBackend"
import type { ApiError } from "@/types"
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

const generatePayload: BillingRecordGeneratePayload = {
  lease_id: "lease-uuid-1",
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

beforeEach(() => {
  mockFetch.mockReset()
})

describe("billingBackend detail extraction", () => {
  it("uses a plain string detail as-is", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ detail: "Billing record already generated for this period" }, 409)
    )
    try {
      await backendGenerateBillingRecord("token", generatePayload)
      throw new Error("expected backendGenerateBillingRecord to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("Billing record already generated for this period")
    }
  })

  it("joins FastAPI's structured 422 validation error array by msg", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        { detail: [{ loc: ["body", "lease_id"], msg: "field required", type: "missing" }] },
        422
      )
    )
    try {
      await backendGenerateBillingRecord("token", generatePayload)
      throw new Error("expected backendGenerateBillingRecord to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("field required")
    }
  })

  it("falls back to the generic message when detail is null", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: null }, 500))
    try {
      await backendGenerateBillingRecord("token", generatePayload)
      throw new Error("expected backendGenerateBillingRecord to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("stringifies a numeric detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: 42 }, 500))
    try {
      await backendGenerateBillingRecord("token", generatePayload)
      throw new Error("expected backendGenerateBillingRecord to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("42")
    }
  })

  it("JSON-stringifies a plain object detail with no msg field", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { code: "E_CONFLICT" } }, 409))
    try {
      await backendGenerateBillingRecord("token", generatePayload)
      throw new Error("expected backendGenerateBillingRecord to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(JSON.stringify({ code: "E_CONFLICT" }))
    }
  })
})

describe("billingBackend actions", () => {
  it("backendGenerateBillingRecord POSTs the payload to /billing-records/generate", async () => {
    mockFetch.mockReturnValue(mockResponse(mockBillingRecord, 201))
    const result = await backendGenerateBillingRecord("my-token", generatePayload)
    expect(result).toEqual(mockBillingRecord)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/billing-records/generate"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(generatePayload),
        headers: expect.objectContaining({ Authorization: "Bearer my-token" }),
      })
    )
  })

  it("backendEvaluateOverdue POSTs to /billing-records/:id/evaluate-overdue", async () => {
    const overdue = { ...mockBillingRecord, status: "overdue" as const }
    mockFetch.mockReturnValue(mockResponse(overdue))
    const result = await backendEvaluateOverdue("token", "billing-uuid-1")
    expect(result).toEqual(overdue)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/billing-records/billing-uuid-1/evaluate-overdue"),
      expect.objectContaining({ method: "POST" })
    )
  })

  it("backendEvaluateOverdue appends an as_of query param when provided", async () => {
    mockFetch.mockReturnValue(mockResponse(mockBillingRecord))
    await backendEvaluateOverdue("token", "billing-uuid-1", "2026-02-01")
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/billing-records/billing-uuid-1/evaluate-overdue?as_of=2026-02-01"),
      expect.any(Object)
    )
  })

  it("backendListBillingRecords GETs /billing-records/?lease_id= and unwraps items", async () => {
    mockFetch.mockReturnValue(mockResponse({ items: [mockBillingRecord], total: 1 }))
    const result = await backendListBillingRecords("token", "lease-uuid-1")
    expect(result).toEqual([mockBillingRecord])
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/billing-records/?lease_id=lease-uuid-1"),
      expect.objectContaining({ method: "GET" })
    )
  })

  it("backendGetBillingRecord GETs /billing-records/:id", async () => {
    mockFetch.mockReturnValue(mockResponse(mockBillingRecord))
    const result = await backendGetBillingRecord("token", "billing-uuid-1")
    expect(result).toEqual(mockBillingRecord)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/billing-records/billing-uuid-1"),
      expect.objectContaining({ method: "GET" })
    )
  })
})
