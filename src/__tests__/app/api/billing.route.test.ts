/**
 * @jest-environment node
 *
 * Tests for the billing Route Handlers:
 *   GET  /api/billing                            → route.ts
 *   GET  /api/billing/[id]                       → [id]/route.ts
 *   POST /api/billing/generate                   → generate/route.ts
 *   POST /api/billing/[id]/evaluate-overdue       → [id]/evaluate-overdue/route.ts
 */

import { NextRequest } from "next/server"
import { ApiError } from "@/types"

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/api/billingBackend", () => ({
  backendGenerateBillingRecord: jest.fn(),
  backendEvaluateOverdue: jest.fn(),
  backendListBillingRecords: jest.fn(),
  backendGetBillingRecord: jest.fn(),
}))

jest.mock("@/lib/auth/session", () => ({
  getToken: jest.fn(),
}))

import * as backend from "@/lib/api/billingBackend"
import * as session from "@/lib/auth/session"
import { GET as listGET } from "@/app/api/billing/route"
import { GET as getByIdGET } from "@/app/api/billing/[id]/route"
import { POST as generatePOST } from "@/app/api/billing/generate/route"
import { POST as evaluateOverduePOST } from "@/app/api/billing/[id]/evaluate-overdue/route"

const mockGenerate = backend.backendGenerateBillingRecord as jest.MockedFunction<
  typeof backend.backendGenerateBillingRecord
>
const mockEvaluate = backend.backendEvaluateOverdue as jest.MockedFunction<
  typeof backend.backendEvaluateOverdue
>
const mockList = backend.backendListBillingRecords as jest.MockedFunction<
  typeof backend.backendListBillingRecords
>
const mockGet = backend.backendGetBillingRecord as jest.MockedFunction<
  typeof backend.backendGetBillingRecord
>
const mockGetToken = session.getToken as jest.MockedFunction<typeof session.getToken>

const mockBillingRecord = {
  id: "billing-uuid-1",
  lease_id: "lease-uuid-1",
  period_start: "2026-01-01",
  period_end: "2026-01-31",
  due_date: "2026-01-05",
  amount_due: "15000.00",
  late_fee_applied: false,
  late_fee_amount_charged: null,
  status: "pending" as const,
  overpaid_amount: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

function makeRequest(url: string, body?: unknown, method = "POST") {
  return new NextRequest(url, {
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

// ─── GET /api/billing ────────────────────────────────────────────────────────

describe("GET /api/billing", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await listGET(
      new NextRequest("http://localhost:3000/api/billing?lease_id=lease-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 400 when lease_id is missing", async () => {
    mockGetToken.mockResolvedValue("token")
    const res = await listGET(new NextRequest("http://localhost:3000/api/billing"))
    expect(res.status).toBe(400)
  })

  it("returns 200 with the billing records for the lease", async () => {
    mockGetToken.mockResolvedValue("token")
    mockList.mockResolvedValue([mockBillingRecord])
    const res = await listGET(
      new NextRequest("http://localhost:3000/api/billing?lease_id=lease-uuid-1")
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([mockBillingRecord])
    expect(mockList).toHaveBeenCalledWith("token", "lease-uuid-1")
  })

  it("returns 500 on unexpected error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockList.mockRejectedValue(new Error("Unexpected"))
    const res = await listGET(
      new NextRequest("http://localhost:3000/api/billing?lease_id=lease-uuid-1")
    )
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})

// ─── GET /api/billing/[id] ───────────────────────────────────────────────────

describe("GET /api/billing/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await getByIdGET(
      new NextRequest("http://localhost:3000/api/billing/billing-uuid-1"),
      idParams("billing-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 200 with the billing record", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGet.mockResolvedValue(mockBillingRecord)
    const res = await getByIdGET(
      new NextRequest("http://localhost:3000/api/billing/billing-uuid-1"),
      idParams("billing-uuid-1")
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(mockBillingRecord)
    expect(mockGet).toHaveBeenCalledWith("token", "billing-uuid-1")
  })

  it("forwards 404 when the billing record doesn't exist", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGet.mockRejectedValue(new ApiError(404, "Billing record not found"))
    const res = await getByIdGET(
      new NextRequest("http://localhost:3000/api/billing/bad-id"),
      idParams("bad-id")
    )
    expect(res.status).toBe(404)
  })

  it("returns 500 on unexpected error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockGet.mockRejectedValue(new Error("Unexpected"))
    const res = await getByIdGET(
      new NextRequest("http://localhost:3000/api/billing/billing-uuid-1"),
      idParams("billing-uuid-1")
    )
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})

// ─── POST /api/billing/generate ─────────────────────────────────────────────

describe("POST /api/billing/generate", () => {
  const payload = { lease_id: "lease-uuid-1" }

  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await generatePOST(
      makeRequest("http://localhost:3000/api/billing/generate", payload)
    )
    expect(res.status).toBe(401)
  })

  it("returns 201 with the generated billing record", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGenerate.mockResolvedValue(mockBillingRecord)
    const res = await generatePOST(
      makeRequest("http://localhost:3000/api/billing/generate", payload)
    )
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(mockBillingRecord)
  })

  it("passes payload to the backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGenerate.mockResolvedValue(mockBillingRecord)
    await generatePOST(makeRequest("http://localhost:3000/api/billing/generate", payload))
    expect(mockGenerate).toHaveBeenCalledWith("token", payload)
  })

  it("forwards 409 when a record for the period already exists", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGenerate.mockRejectedValue(
      new ApiError(409, "Billing record already generated for this period")
    )
    const res = await generatePOST(
      makeRequest("http://localhost:3000/api/billing/generate", payload)
    )
    expect(res.status).toBe(409)
  })

  it("returns 500 on unexpected error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockGenerate.mockRejectedValue(new Error("Unexpected"))
    const res = await generatePOST(
      makeRequest("http://localhost:3000/api/billing/generate", payload)
    )
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})

// ─── POST /api/billing/[id]/evaluate-overdue ───────────────────────────────

describe("POST /api/billing/[id]/evaluate-overdue", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await evaluateOverduePOST(
      makeRequest("http://localhost:3000/api/billing/billing-uuid-1/evaluate-overdue"),
      idParams("billing-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 200 with the re-evaluated billing record", async () => {
    mockGetToken.mockResolvedValue("token")
    const overdue = { ...mockBillingRecord, status: "overdue" as const }
    mockEvaluate.mockResolvedValue(overdue)
    const res = await evaluateOverduePOST(
      makeRequest("http://localhost:3000/api/billing/billing-uuid-1/evaluate-overdue"),
      idParams("billing-uuid-1")
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(overdue)
  })

  it("passes id and as_of query param to the backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockEvaluate.mockResolvedValue(mockBillingRecord)
    await evaluateOverduePOST(
      makeRequest(
        "http://localhost:3000/api/billing/billing-uuid-1/evaluate-overdue?as_of=2026-02-01"
      ),
      idParams("billing-uuid-1")
    )
    expect(mockEvaluate).toHaveBeenCalledWith("token", "billing-uuid-1", "2026-02-01")
  })

  it("passes undefined as_of when not provided", async () => {
    mockGetToken.mockResolvedValue("token")
    mockEvaluate.mockResolvedValue(mockBillingRecord)
    await evaluateOverduePOST(
      makeRequest("http://localhost:3000/api/billing/billing-uuid-1/evaluate-overdue"),
      idParams("billing-uuid-1")
    )
    expect(mockEvaluate).toHaveBeenCalledWith("token", "billing-uuid-1", undefined)
  })

  it("forwards 404 when the billing record doesn't exist", async () => {
    mockGetToken.mockResolvedValue("token")
    mockEvaluate.mockRejectedValue(new ApiError(404, "Billing record not found"))
    const res = await evaluateOverduePOST(
      makeRequest("http://localhost:3000/api/billing/bad-id/evaluate-overdue"),
      idParams("bad-id")
    )
    expect(res.status).toBe(404)
  })

  it("returns 500 on unexpected error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockEvaluate.mockRejectedValue(new Error("Unexpected"))
    const res = await evaluateOverduePOST(
      makeRequest("http://localhost:3000/api/billing/billing-uuid-1/evaluate-overdue"),
      idParams("billing-uuid-1")
    )
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})
