/**
 * Tests for lib/api/billingBackend.ts
 *
 * Covers the server-side calls to FastAPI billing-record endpoints. Detail/
 * fieldErrors extraction and timeout behavior are shared by every
 * *Backend.ts module and are covered once in shared/backendFetch.test.ts
 * rather than duplicated here.
 */

import {
  backendGenerateBillingRecord,
  backendEvaluateOverdue,
  backendListBillingRecords,
  backendGetBillingRecord,
} from "@/lib/api/billingBackend"
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
