/**
 * Tests for lib/api/receiptsBackend.ts
 *
 * Covers the server-side calls to FastAPI receipt endpoints, including the
 * document-and-storage composition behind the PDF download passthrough.
 *
 * Unlike contracts/payments/properties, GET /payments/{id}/receipts returns
 * a bare array, not a {items,total} paginated envelope (confirmed against
 * openapi.json's `Response List Receipts For Payment ... Get` schema) — so
 * backendListReceiptsForPayment must NOT try to unwrap `.items`.
 */

import {
  backendListReceiptsForPayment,
  backendGetReceipt,
  backendIssueReceipt,
  backendGetReceiptFile,
} from "@/lib/api/receiptsBackend"
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

describe("receiptsBackend CRUD", () => {
  it("backendListReceiptsForPayment returns the bare array and injects the auth header", async () => {
    mockFetch.mockReturnValue(mockResponse([mockReceipt]))
    const result = await backendListReceiptsForPayment("my-token", "payment-uuid-1")
    expect(result).toEqual([mockReceipt])
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/payments/payment-uuid-1/receipts"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer my-token" }),
      })
    )
  })

  it("backendGetReceipt fetches a single receipt by id", async () => {
    mockFetch.mockReturnValue(mockResponse(mockReceipt))
    const result = await backendGetReceipt("token", "receipt-uuid-1")
    expect(result).toEqual(mockReceipt)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/receipts/receipt-uuid-1"),
      expect.any(Object)
    )
  })

  it("backendIssueReceipt POSTs to the payment's receipts endpoint with no body", async () => {
    mockFetch.mockReturnValue(mockResponse(mockReceipt, 201))
    const result = await backendIssueReceipt("token", "payment-uuid-1")
    expect(result).toEqual(mockReceipt)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/payments/payment-uuid-1/receipts"),
      expect.objectContaining({ method: "POST" })
    )
  })

  it("backendIssueReceipt returns a distinct record on reprint (never the same id twice)", async () => {
    const reprint: Receipt = { ...mockReceipt, id: "receipt-uuid-2", receipt_number: 2 }
    mockFetch.mockReturnValue(mockResponse(reprint, 201))
    const result = await backendIssueReceipt("token", "payment-uuid-1")
    expect(result.id).not.toBe(mockReceipt.id)
    expect(result).toEqual(reprint)
  })

  it("propagates a structured error detail when the backend rejects the request", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Payment not found" }, 404))
    await expect(backendGetReceipt("token", "missing")).rejects.toMatchObject({
      status: 404,
      detail: "Payment not found",
    })
  })
})

describe("backendGetReceiptFile", () => {
  const mockDocument = {
    id: "document-uuid-1",
    file_name: "receipt-1.pdf",
    file_type: "application/pdf",
    file_url: "https://minio.internal/receipts/receipt-1.pdf",
  }

  it("resolves the receipt's document, then fetches the file bytes from storage", async () => {
    mockFetch
      .mockReturnValueOnce(mockResponse(mockReceipt)) // GET /receipts/{id}
      .mockReturnValueOnce(mockResponse(mockDocument)) // GET /documents/{document_id}
      .mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map([["content-type", "application/pdf"]]) as unknown as Headers,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        } as unknown as Response)
      )

    const result = await backendGetReceiptFile("token", "receipt-uuid-1")

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/receipts/receipt-uuid-1"),
      expect.any(Object)
    )
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/documents/document-uuid-1"),
      expect.any(Object)
    )
    expect(mockFetch).toHaveBeenNthCalledWith(3, mockDocument.file_url)
    expect(result.filename).toBe("receipt-1.pdf")
    expect(result.contentType).toBe("application/pdf")
    expect(result.bytes.byteLength).toBe(8)
  })

  it("throws an ApiError when the storage fetch fails", async () => {
    mockFetch
      .mockReturnValueOnce(mockResponse(mockReceipt))
      .mockReturnValueOnce(mockResponse(mockDocument))
      .mockReturnValueOnce(Promise.resolve({ ok: false, status: 502 } as Response))

    await expect(backendGetReceiptFile("token", "receipt-uuid-1")).rejects.toBeInstanceOf(ApiError)
  })
})
