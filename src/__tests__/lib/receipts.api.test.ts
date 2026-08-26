/**
 * Tests for lib/api/receipts.ts — client-side receipt API wrapper.
 * Calls Next.js Route Handlers, mirrors contracts.ts/payments.ts conventions.
 */

import { receiptsApi } from "@/lib/api/receipts"
import type { Receipt } from "@/types/receipt"

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

const mockReceipt: Receipt = {
  id: "receipt-uuid-1",
  receipt_number: 1,
  payment_id: "payment-uuid-1",
  document_id: "document-uuid-1",
  created_at: "2026-01-05T00:00:00Z",
  updated_at: "2026-01-05T00:00:00Z",
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe("receiptsApi", () => {
  it("listForPayment calls GET /api/payments/{id}/receipts", async () => {
    mockFetch.mockReturnValue(mockResponse([mockReceipt]))
    const result = await receiptsApi.listForPayment("payment-uuid-1")
    expect(result).toEqual([mockReceipt])
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/payments/payment-uuid-1/receipts",
      expect.any(Object)
    )
  })

  it("get calls GET /api/receipts/{id}", async () => {
    mockFetch.mockReturnValue(mockResponse(mockReceipt))
    const result = await receiptsApi.get("receipt-uuid-1")
    expect(result).toEqual(mockReceipt)
    expect(mockFetch).toHaveBeenCalledWith("/api/receipts/receipt-uuid-1", expect.any(Object))
  })

  it("issue POSTs to /api/payments/{id}/receipts with no body (used for reprint too)", async () => {
    mockFetch.mockReturnValue(mockResponse(mockReceipt, 201))
    const result = await receiptsApi.issue("payment-uuid-1")
    expect(result).toEqual(mockReceipt)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/payments/payment-uuid-1/receipts",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("downloadUrl returns the download passthrough path without fetching", () => {
    expect(receiptsApi.downloadUrl("receipt-uuid-1")).toBe("/api/receipts/receipt-uuid-1/download")
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("propagates a structured error detail on failure", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Payment not found" }, 404))
    await expect(receiptsApi.get("missing")).rejects.toMatchObject({
      status: 404,
      detail: "Payment not found",
    })
  })
})
