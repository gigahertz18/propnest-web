/**
 * @jest-environment node
 *
 * Tests for the receipts Route Handlers:
 *   GET  /api/payments/[id]/receipts          → payments/[id]/receipts/route.ts
 *   POST /api/payments/[id]/receipts          → payments/[id]/receipts/route.ts
 *   GET  /api/receipts/[id]                   → receipts/[id]/route.ts
 *   GET  /api/receipts/[id]/download          → receipts/[id]/download/route.ts
 *
 * There is no flat GET /api/v1/receipts/ (list-all) on propnest-api — only
 * per-payment listing and single-receipt get — so unlike contracts/payments
 * there's no top-level src/app/api/receipts/route.ts list/create pair here.
 */

import { NextRequest } from "next/server"
import { ApiError } from "@/types"

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/api/receiptsBackend", () => ({
  backendListReceiptsForPayment: jest.fn(),
  backendIssueReceipt: jest.fn(),
  backendGetReceipt: jest.fn(),
  backendGetReceiptFile: jest.fn(),
}))

jest.mock("@/lib/auth/session", () => ({
  getToken: jest.fn(),
}))

import * as backend from "@/lib/api/receiptsBackend"
import * as session from "@/lib/auth/session"
import { GET as listGET, POST as issuePOST } from "@/app/api/payments/[id]/receipts/route"
import { GET as getGET } from "@/app/api/receipts/[id]/route"
import { GET as downloadGET } from "@/app/api/receipts/[id]/download/route"

const mockList = backend.backendListReceiptsForPayment as jest.MockedFunction<
  typeof backend.backendListReceiptsForPayment
>
const mockIssue = backend.backendIssueReceipt as jest.MockedFunction<
  typeof backend.backendIssueReceipt
>
const mockGet = backend.backendGetReceipt as jest.MockedFunction<typeof backend.backendGetReceipt>
const mockGetFile = backend.backendGetReceiptFile as jest.MockedFunction<
  typeof backend.backendGetReceiptFile
>
const mockGetToken = session.getToken as jest.MockedFunction<typeof session.getToken>

const mockReceipt = {
  id: "receipt-uuid-1",
  receipt_number: 1,
  payment_id: "payment-uuid-1",
  document_id: "document-uuid-1",
  created_at: "2026-01-05T00:00:00Z",
  updated_at: "2026-01-05T00:00:00Z",
}

const idParams = (id: string) => ({ params: Promise.resolve({ id }) })

function makeRequest(url: string, method = "GET") {
  return new NextRequest(url, { method })
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET/POST /api/payments/[id]/receipts ──────────────────────────────────

describe("GET /api/payments/[id]/receipts", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await listGET(
      makeRequest("http://localhost:3000/api/payments/payment-uuid-1/receipts"),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 200 with the receipt history for the payment", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockList.mockResolvedValue([mockReceipt])
    const res = await listGET(
      makeRequest("http://localhost:3000/api/payments/payment-uuid-1/receipts"),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([mockReceipt])
    expect(mockList).toHaveBeenCalledWith("valid-token", "payment-uuid-1")
  })

  it("returns 500 on unexpected backend error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockList.mockRejectedValue(new Error("Database connection lost"))
    const res = await listGET(
      makeRequest("http://localhost:3000/api/payments/payment-uuid-1/receipts"),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})

describe("POST /api/payments/[id]/receipts", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await issuePOST(
      makeRequest("http://localhost:3000/api/payments/payment-uuid-1/receipts", "POST"),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 201 with the newly issued receipt (first issuance or reprint)", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockIssue.mockResolvedValue(mockReceipt)
    const res = await issuePOST(
      makeRequest("http://localhost:3000/api/payments/payment-uuid-1/receipts", "POST"),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(mockReceipt)
    expect(mockIssue).toHaveBeenCalledWith("valid-token", "payment-uuid-1")
  })

  it("propagates the backend's ApiError status and detail", async () => {
    mockGetToken.mockResolvedValue("token")
    mockIssue.mockRejectedValue(new ApiError(404, "Payment not found"))
    const res = await issuePOST(
      makeRequest("http://localhost:3000/api/payments/payment-uuid-1/receipts", "POST"),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ detail: "Payment not found" })
  })
})

// ─── GET /api/receipts/[id] ─────────────────────────────────────────────────

describe("GET /api/receipts/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await getGET(
      makeRequest("http://localhost:3000/api/receipts/receipt-uuid-1"),
      idParams("receipt-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 200 with the receipt", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockGet.mockResolvedValue(mockReceipt)
    const res = await getGET(
      makeRequest("http://localhost:3000/api/receipts/receipt-uuid-1"),
      idParams("receipt-uuid-1")
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(mockReceipt)
    expect(mockGet).toHaveBeenCalledWith("valid-token", "receipt-uuid-1")
  })
})

// ─── GET /api/receipts/[id]/download ────────────────────────────────────────

describe("GET /api/receipts/[id]/download", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await downloadGET(
      makeRequest("http://localhost:3000/api/receipts/receipt-uuid-1/download"),
      idParams("receipt-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("streams the PDF bytes with the correct content headers", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockGetFile.mockResolvedValue({
      bytes: new ArrayBuffer(4),
      contentType: "application/pdf",
      filename: "receipt-1.pdf",
    })
    const res = await downloadGET(
      makeRequest("http://localhost:3000/api/receipts/receipt-uuid-1/download"),
      idParams("receipt-uuid-1")
    )
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("application/pdf")
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="receipt-1.pdf"')
    expect(mockGetFile).toHaveBeenCalledWith("valid-token", "receipt-uuid-1")
  })

  it("propagates a 404 when the receipt/document/file chain fails", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGetFile.mockRejectedValue(new ApiError(404, "Receipt not found"))
    const res = await downloadGET(
      makeRequest("http://localhost:3000/api/receipts/missing/download"),
      idParams("missing")
    )
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ detail: "Receipt not found" })
  })
})
