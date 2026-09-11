/**
 * Tests for lib/api/receipts.ts — client-side receipt API wrapper.
 * Calls Next.js Route Handlers, mirrors contracts.ts/payments.ts conventions.
 */

import { receiptsApi } from "@/lib/api/receipts"
import { ApiError } from "@/types"
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

  describe("download", () => {
    function mockFileResponse(
      ok: boolean,
      {
        headers = [["content-type", "application/pdf"]],
        status = 200,
      }: { headers?: [string, string][]; status?: number } = {}
    ) {
      return Promise.resolve({
        ok,
        status,
        headers: new Map(headers) as unknown as Headers,
        blob: () => Promise.resolve(new Blob(["pdf-bytes"])),
        json: () => Promise.reject(new Error("not json")),
      } as unknown as Response)
    }

    it("resolves a blob and the filename parsed from Content-Disposition on success", async () => {
      mockFetch.mockReturnValueOnce(
        mockFileResponse(true, {
          headers: [
            ["content-type", "application/pdf"],
            ["content-disposition", 'attachment; filename="receipt-3.pdf"'],
          ],
        })
      )

      const result = await receiptsApi.download("receipt-uuid-3", 3)

      expect(mockFetch.mock.calls[0][0]).toBe("/api/receipts/receipt-uuid-3/download")
      expect(result.filename).toBe("receipt-3.pdf")
      expect(result.blob).toBeInstanceOf(Blob)
    })

    it("falls back to receipt-{receiptNumber}.pdf when Content-Disposition is absent", async () => {
      mockFetch.mockReturnValueOnce(mockFileResponse(true))

      const result = await receiptsApi.download("receipt-uuid-3", 3)

      expect(result.filename).toBe("receipt-3.pdf")
    })

    it("throws an ApiError with the parsed detail on a non-ok JSON error response", async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ detail: "Not authorized" }, 403))

      await expect(receiptsApi.download("receipt-uuid-3")).rejects.toMatchObject({
        status: 403,
        detail: "Not authorized",
      })
    })

    it("throws an ApiError when the response is ok but not a PDF, instead of silently returning the body as a file", async () => {
      mockFetch.mockReturnValueOnce(
        mockFileResponse(true, { headers: [["content-type", "application/json"]] })
      )

      await expect(receiptsApi.download("receipt-uuid-3")).rejects.toBeInstanceOf(ApiError)
    })
  })
})
