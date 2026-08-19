/**
 * @jest-environment node
 *
 * Tests for the payments Route Handlers:
 *   GET  /api/payments               → route.ts
 *   POST /api/payments               → route.ts
 *   GET    /api/payments/[id]        → [id]/route.ts
 *   PATCH  /api/payments/[id]        → [id]/route.ts
 *   DELETE /api/payments/[id]        → [id]/route.ts
 *   POST   /api/payments/[id]/corrections → [id]/corrections/route.ts
 */

import { NextRequest } from "next/server"
import { ApiError } from "@/types"

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/api/paymentsBackend", () => ({
  backendListPayments: jest.fn(),
  backendGetPayment: jest.fn(),
  backendCreatePayment: jest.fn(),
  backendUpdatePayment: jest.fn(),
  backendDeletePayment: jest.fn(),
  backendCorrectPayment: jest.fn(),
}))

jest.mock("@/lib/auth/session", () => ({
  getToken: jest.fn(),
}))

import * as backend from "@/lib/api/paymentsBackend"
import * as session from "@/lib/auth/session"
import { GET as listGET, POST as listPOST } from "@/app/api/payments/route"
import { GET as getGET, PATCH, DELETE } from "@/app/api/payments/[id]/route"
import { POST as correctPOST } from "@/app/api/payments/[id]/corrections/route"

const mockList = backend.backendListPayments as jest.MockedFunction<
  typeof backend.backendListPayments
>
const mockGet = backend.backendGetPayment as jest.MockedFunction<typeof backend.backendGetPayment>
const mockCreate = backend.backendCreatePayment as jest.MockedFunction<
  typeof backend.backendCreatePayment
>
const mockUpdate = backend.backendUpdatePayment as jest.MockedFunction<
  typeof backend.backendUpdatePayment
>
const mockDelete = backend.backendDeletePayment as jest.MockedFunction<
  typeof backend.backendDeletePayment
>
const mockCorrect = backend.backendCorrectPayment as jest.MockedFunction<
  typeof backend.backendCorrectPayment
>
const mockGetToken = session.getToken as jest.MockedFunction<typeof session.getToken>

const mockPayment = {
  id: "payment-uuid-1",
  contract_id: "contract-uuid-1",
  billing_record_id: "billing-uuid-1",
  amount: "15000.00",
  paid_at: "2026-01-05T00:00:00Z",
  payment_method: "gcash",
  status: "PAID" as const,
  reference_number: "REF-001",
  corrects_payment_id: null,
  created_at: "2026-01-05T00:00:00Z",
  updated_at: "2026-01-05T00:00:00Z",
}

function makeRequest(body?: unknown, method = "GET") {
  return new NextRequest("http://localhost:3000/api/payments", {
    method,
    ...(body
      ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }
      : {}),
  })
}

function makeIdRequest(id: string, body?: unknown, method = "PATCH") {
  return new NextRequest(`http://localhost:3000/api/payments/${id}`, {
    method,
    ...(body
      ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }
      : {}),
  })
}

const idParams = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET /api/payments ──────────────────────────────────────────────────────

describe("GET /api/payments", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await listGET()
    expect(res.status).toBe(401)
  })

  it("returns 200 with payment list on success", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockList.mockResolvedValue([mockPayment])
    const res = await listGET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([mockPayment])
  })

  it("passes the token to the backend", async () => {
    mockGetToken.mockResolvedValue("my-token")
    mockList.mockResolvedValue([])
    await listGET()
    expect(mockList).toHaveBeenCalledWith("my-token")
  })

  it("returns 500 on unexpected backend error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockList.mockRejectedValue(new Error("Database connection lost"))
    const res = await listGET()
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})

// ─── POST /api/payments ─────────────────────────────────────────────────────

describe("POST /api/payments", () => {
  const payload = {
    contract_id: "contract-uuid-1",
    billing_record_id: "billing-uuid-1",
    amount: "15000.00",
  }

  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(401)
  })

  it("returns 201 with created payment on success", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockCreate.mockResolvedValue(mockPayment)
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(mockPayment)
  })

  it("passes payload to the backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockResolvedValue(mockPayment)
    await listPOST(makeRequest(payload, "POST"))
    expect(mockCreate).toHaveBeenCalledWith("token", payload)
  })

  it("forwards 422 when amount validation fails", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockRejectedValue(new ApiError(422, "amount must be greater than 0"))
    const res = await listPOST(makeRequest({ ...payload, amount: "0" }, "POST"))
    expect(res.status).toBe(422)
  })

  it("returns 500 on unexpected error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockRejectedValue(new Error("Unexpected"))
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})

// ─── GET /api/payments/[id] ─────────────────────────────────────────────────

describe("GET /api/payments/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await getGET(
      makeIdRequest("payment-uuid-1", undefined, "GET"),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 200 with payment on success", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGet.mockResolvedValue(mockPayment)
    const res = await getGET(
      makeIdRequest("payment-uuid-1", undefined, "GET"),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(mockPayment)
  })

  it("forwards 404 when payment not found", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGet.mockRejectedValue(new ApiError(404, "Payment not found"))
    const res = await getGET(makeIdRequest("bad-id", undefined, "GET"), idParams("bad-id"))
    expect(res.status).toBe(404)
  })
})

// ─── PATCH /api/payments/[id] ───────────────────────────────────────────────

describe("PATCH /api/payments/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await PATCH(
      makeIdRequest("payment-uuid-1", { status: "VOIDED" }),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 200 with updated payment", async () => {
    mockGetToken.mockResolvedValue("token")
    const updated = { ...mockPayment, status: "VOIDED" as const }
    mockUpdate.mockResolvedValue(updated)
    const res = await PATCH(
      makeIdRequest("payment-uuid-1", { status: "VOIDED" }),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(updated)
  })

  it("passes id and payload to backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockResolvedValue(mockPayment)
    await PATCH(makeIdRequest("payment-uuid-1", { status: "VOIDED" }), idParams("payment-uuid-1"))
    expect(mockUpdate).toHaveBeenCalledWith("token", "payment-uuid-1", { status: "VOIDED" })
  })

  it("forwards 404 when payment not found", async () => {
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockRejectedValue(new ApiError(404, "Payment not found"))
    const res = await PATCH(makeIdRequest("bad-id", { status: "PAID" }), idParams("bad-id"))
    expect(res.status).toBe(404)
  })
})

// ─── DELETE /api/payments/[id] ──────────────────────────────────────────────

describe("DELETE /api/payments/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await DELETE(
      makeIdRequest("payment-uuid-1", undefined, "DELETE"),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 204 on successful delete", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockResolvedValue(undefined)
    const res = await DELETE(
      makeIdRequest("payment-uuid-1", undefined, "DELETE"),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(204)
  })

  it("passes id to the backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockResolvedValue(undefined)
    await DELETE(makeIdRequest("payment-uuid-1", undefined, "DELETE"), idParams("payment-uuid-1"))
    expect(mockDelete).toHaveBeenCalledWith("token", "payment-uuid-1")
  })

  it("forwards 404 when payment not found", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockRejectedValue(new ApiError(404, "Payment not found"))
    const res = await DELETE(makeIdRequest("bad-id", undefined, "DELETE"), idParams("bad-id"))
    expect(res.status).toBe(404)
  })
})

// ─── POST /api/payments/[id]/corrections ───────────────────────────────────

describe("POST /api/payments/[id]/corrections", () => {
  const correction = { amount: "14000.00", paid_at: "2026-01-06T00:00:00Z" }

  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await correctPOST(
      makeIdRequest("payment-uuid-1", correction, "POST"),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 201 with the corrected payment", async () => {
    mockGetToken.mockResolvedValue("token")
    const corrected = {
      ...mockPayment,
      id: "payment-uuid-2",
      corrects_payment_id: "payment-uuid-1",
    }
    mockCorrect.mockResolvedValue(corrected)
    const res = await correctPOST(
      makeIdRequest("payment-uuid-1", correction, "POST"),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(corrected)
  })

  it("passes id and payload to backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCorrect.mockResolvedValue(mockPayment)
    await correctPOST(
      makeIdRequest("payment-uuid-1", correction, "POST"),
      idParams("payment-uuid-1")
    )
    expect(mockCorrect).toHaveBeenCalledWith("token", "payment-uuid-1", correction)
  })

  it("forwards 404 when the payment being corrected doesn't exist", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCorrect.mockRejectedValue(new ApiError(404, "Payment not found"))
    const res = await correctPOST(makeIdRequest("bad-id", correction, "POST"), idParams("bad-id"))
    expect(res.status).toBe(404)
  })

  it("returns 500 on unexpected error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockCorrect.mockRejectedValue(new Error("Unexpected"))
    const res = await correctPOST(
      makeIdRequest("payment-uuid-1", correction, "POST"),
      idParams("payment-uuid-1")
    )
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})
