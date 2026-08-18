/**
 * @jest-environment node
 *
 * Tests for the leases Route Handlers:
 *   GET  /api/leases        → route.ts
 *   POST /api/leases        → route.ts
 *   GET    /api/leases/[id] → [id]/route.ts
 *   PATCH  /api/leases/[id] → [id]/route.ts
 *   DELETE /api/leases/[id] → [id]/route.ts
 */

import { NextRequest } from "next/server"
import { ApiError } from "@/types"

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/api/leasesBackend", () => ({
  backendListLeases: jest.fn(),
  backendGetLease: jest.fn(),
  backendCreateLease: jest.fn(),
  backendUpdateLease: jest.fn(),
  backendDeleteLease: jest.fn(),
}))

jest.mock("@/lib/auth/session", () => ({
  getToken: jest.fn(),
}))

import * as backend from "@/lib/api/leasesBackend"
import * as session from "@/lib/auth/session"
import { GET as listGET, POST as listPOST } from "@/app/api/leases/route"
import { GET as getGET, PATCH, DELETE } from "@/app/api/leases/[id]/route"

const mockList = backend.backendListLeases as jest.MockedFunction<typeof backend.backendListLeases>
const mockGet = backend.backendGetLease as jest.MockedFunction<typeof backend.backendGetLease>
const mockCreate = backend.backendCreateLease as jest.MockedFunction<typeof backend.backendCreateLease>
const mockUpdate = backend.backendUpdateLease as jest.MockedFunction<typeof backend.backendUpdateLease>
const mockDelete = backend.backendDeleteLease as jest.MockedFunction<typeof backend.backendDeleteLease>
const mockGetToken = session.getToken as jest.MockedFunction<typeof session.getToken>

const mockLease = {
  id: "lease-uuid-1",
  contract_id: "contract-uuid-1",
  monthly_rent: "15000.00",
  due_day: 5,
  billing_cycle: "monthly" as const,
  security_deposit: "30000.00",
  advance_payment: null,
  late_fee_amount: null,
  late_fee_percent: null,
  grace_period_days: 0,
  renewal_option: "none" as const,
  status: "ACTIVE" as const,
  start_date: "2026-01-01",
  end_date: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

function makeRequest(body?: unknown, method = "GET") {
  return new NextRequest("http://localhost:3000/api/leases", {
    method,
    ...(body
      ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }
      : {}),
  })
}

function makeIdRequest(id: string, body?: unknown, method = "PATCH") {
  return new NextRequest(`http://localhost:3000/api/leases/${id}`, {
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

// ─── GET /api/leases ────────────────────────────────────────────────────────

describe("GET /api/leases", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await listGET()
    expect(res.status).toBe(401)
  })

  it("returns 200 with lease list on success", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockList.mockResolvedValue([mockLease])
    const res = await listGET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([mockLease])
  })

  it("returns empty array when no leases exist", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockList.mockResolvedValue([])
    const res = await listGET()
    expect(await res.json()).toEqual([])
  })

  it("passes the token to the backend", async () => {
    mockGetToken.mockResolvedValue("my-token")
    mockList.mockResolvedValue([])
    await listGET()
    expect(mockList).toHaveBeenCalledWith("my-token")
  })

  it("forwards backend ApiError status and detail", async () => {
    mockGetToken.mockResolvedValue("token")
    mockList.mockRejectedValue(new ApiError(403, "Forbidden"))
    const res = await listGET()
    expect(res.status).toBe(403)
    expect((await res.json()).detail).toBe("Forbidden")
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

// ─── POST /api/leases ───────────────────────────────────────────────────────

describe("POST /api/leases", () => {
  const payload = {
    contract_id: "contract-uuid-1",
    monthly_rent: "15000.00",
    due_day: 5,
    start_date: "2026-01-01",
  }

  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(401)
  })

  it("returns 201 with created lease on success", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockCreate.mockResolvedValue(mockLease)
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(mockLease)
  })

  it("passes payload to the backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockResolvedValue(mockLease)
    await listPOST(makeRequest(payload, "POST"))
    expect(mockCreate).toHaveBeenCalledWith("token", payload)
  })

  it("forwards 400 when the rental type doesn't match the contract's terms", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockRejectedValue(new ApiError(400, "Lease requires a long-term contract"))
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(400)
  })

  it("forwards 409 when the contract already has a lease", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockRejectedValue(new ApiError(409, "Contract already has a lease"))
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(409)
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

// ─── GET /api/leases/[id] ───────────────────────────────────────────────────

describe("GET /api/leases/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await getGET(makeIdRequest("lease-uuid-1", undefined, "GET"), idParams("lease-uuid-1"))
    expect(res.status).toBe(401)
  })

  it("returns 200 with lease on success", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGet.mockResolvedValue(mockLease)
    const res = await getGET(makeIdRequest("lease-uuid-1", undefined, "GET"), idParams("lease-uuid-1"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(mockLease)
  })

  it("forwards 404 when lease not found", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGet.mockRejectedValue(new ApiError(404, "Lease not found"))
    const res = await getGET(makeIdRequest("bad-id", undefined, "GET"), idParams("bad-id"))
    expect(res.status).toBe(404)
  })
})

// ─── PATCH /api/leases/[id] ─────────────────────────────────────────────────

describe("PATCH /api/leases/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await PATCH(makeIdRequest("lease-uuid-1", { status: "ENDED" }), idParams("lease-uuid-1"))
    expect(res.status).toBe(401)
  })

  it("returns 200 with updated lease", async () => {
    mockGetToken.mockResolvedValue("token")
    const updated = { ...mockLease, status: "ENDED" as const }
    mockUpdate.mockResolvedValue(updated)
    const res = await PATCH(makeIdRequest("lease-uuid-1", { status: "ENDED" }), idParams("lease-uuid-1"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(updated)
  })

  it("passes id and payload to backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockResolvedValue(mockLease)
    await PATCH(makeIdRequest("lease-uuid-1", { status: "ENDED" }), idParams("lease-uuid-1"))
    expect(mockUpdate).toHaveBeenCalledWith("token", "lease-uuid-1", { status: "ENDED" })
  })

  it("forwards 404 when lease not found", async () => {
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockRejectedValue(new ApiError(404, "Lease not found"))
    const res = await PATCH(makeIdRequest("bad-id", { status: "ACTIVE" }), idParams("bad-id"))
    expect(res.status).toBe(404)
  })

  it("returns 500 on unexpected error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockRejectedValue(new Error("DB error"))
    const res = await PATCH(makeIdRequest("lease-uuid-1", {}), idParams("lease-uuid-1"))
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})

// ─── DELETE /api/leases/[id] ────────────────────────────────────────────────

describe("DELETE /api/leases/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await DELETE(makeIdRequest("lease-uuid-1", undefined, "DELETE"), idParams("lease-uuid-1"))
    expect(res.status).toBe(401)
  })

  it("returns 204 on successful delete", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockResolvedValue(undefined)
    const res = await DELETE(makeIdRequest("lease-uuid-1", undefined, "DELETE"), idParams("lease-uuid-1"))
    expect(res.status).toBe(204)
  })

  it("passes id to the backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockResolvedValue(undefined)
    await DELETE(makeIdRequest("lease-uuid-1", undefined, "DELETE"), idParams("lease-uuid-1"))
    expect(mockDelete).toHaveBeenCalledWith("token", "lease-uuid-1")
  })

  it("forwards 404 when lease not found", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockRejectedValue(new ApiError(404, "Lease not found"))
    const res = await DELETE(makeIdRequest("bad-id", undefined, "DELETE"), idParams("bad-id"))
    expect(res.status).toBe(404)
  })

  it("returns 500 on unexpected error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockRejectedValue(new Error("Unexpected"))
    const res = await DELETE(makeIdRequest("lease-uuid-1", undefined, "DELETE"), idParams("lease-uuid-1"))
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})
