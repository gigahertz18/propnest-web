/**
 * @jest-environment node
 *
 * Tests for the contracts Route Handlers:
 *   GET  /api/contracts        → route.ts
 *   POST /api/contracts        → route.ts
 *   GET    /api/contracts/[id] → [id]/route.ts
 *   PATCH  /api/contracts/[id] → [id]/route.ts
 *   DELETE /api/contracts/[id] → [id]/route.ts
 */

import { NextRequest } from "next/server"
import { ApiError } from "@/types"

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/api/contractsBackend", () => ({
  backendListContracts: jest.fn(),
  backendGetContract: jest.fn(),
  backendCreateContract: jest.fn(),
  backendUpdateContract: jest.fn(),
  backendDeleteContract: jest.fn(),
}))

jest.mock("@/lib/auth/session", () => ({
  getToken: jest.fn(),
}))

import * as backend from "@/lib/api/contractsBackend"
import * as session from "@/lib/auth/session"
import { GET as listGET, POST as listPOST } from "@/app/api/contracts/route"
import { GET as getGET, PATCH, DELETE } from "@/app/api/contracts/[id]/route"

const mockList = backend.backendListContracts as jest.MockedFunction<
  typeof backend.backendListContracts
>
const mockGet = backend.backendGetContract as jest.MockedFunction<typeof backend.backendGetContract>
const mockCreate = backend.backendCreateContract as jest.MockedFunction<
  typeof backend.backendCreateContract
>
const mockUpdate = backend.backendUpdateContract as jest.MockedFunction<
  typeof backend.backendUpdateContract
>
const mockDelete = backend.backendDeleteContract as jest.MockedFunction<
  typeof backend.backendDeleteContract
>
const mockGetToken = session.getToken as jest.MockedFunction<typeof session.getToken>

const mockContract = {
  id: "contract-uuid-1",
  property_id: "prop-uuid-1",
  tenant_id: "tenant-uuid-1",
  rental_type: "long_term" as const,
  start_date: "2026-01-01",
  end_date: null,
  rent_amount: "15000.00",
  deposit: "30000.00",
  booking_source: "direct",
  status: "ACTIVE" as const,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

function makeRequest(body?: unknown, method = "GET") {
  return new NextRequest("http://localhost:3000/api/contracts", {
    method,
    ...(body
      ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }
      : {}),
  })
}

function makeIdRequest(id: string, body?: unknown, method = "PATCH") {
  return new NextRequest(`http://localhost:3000/api/contracts/${id}`, {
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

// ─── GET /api/contracts ────────────────────────────────────────────────────────

describe("GET /api/contracts", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await listGET()
    expect(res.status).toBe(401)
  })

  it("returns 200 with contract list on success", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockList.mockResolvedValue([mockContract])
    const res = await listGET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([mockContract])
  })

  it("returns empty array when no contracts exist", async () => {
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

// ─── POST /api/contracts ───────────────────────────────────────────────────────

describe("POST /api/contracts", () => {
  const payload = {
    property_id: "prop-uuid-1",
    tenant_id: "tenant-uuid-1",
    rental_type: "long_term",
    start_date: "2026-01-01",
    rent_amount: "15000.00",
  }

  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(401)
  })

  it("returns 201 with created contract on success", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockCreate.mockResolvedValue(mockContract)
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(mockContract)
  })

  it("passes payload to the backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockResolvedValue(mockContract)
    await listPOST(makeRequest(payload, "POST"))
    expect(mockCreate).toHaveBeenCalledWith("token", payload)
  })

  it("forwards 422 on validation error", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockRejectedValue(new ApiError(422, "rent_amount must be greater than 0"))
    const res = await listPOST(makeRequest({ ...payload, rent_amount: "-1" }, "POST"))
    expect(res.status).toBe(422)
  })

  it("forwards 409 when property already has an active contract", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockRejectedValue(new ApiError(409, "Property already has an active contract"))
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

// ─── GET /api/contracts/[id] ───────────────────────────────────────────────────

describe("GET /api/contracts/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await getGET(
      makeIdRequest("contract-uuid-1", undefined, "GET"),
      idParams("contract-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 200 with contract on success", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGet.mockResolvedValue(mockContract)
    const res = await getGET(
      makeIdRequest("contract-uuid-1", undefined, "GET"),
      idParams("contract-uuid-1")
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(mockContract)
  })

  it("forwards 404 when contract not found", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGet.mockRejectedValue(new ApiError(404, "Contract not found"))
    const res = await getGET(makeIdRequest("bad-id", undefined, "GET"), idParams("bad-id"))
    expect(res.status).toBe(404)
  })
})

// ─── PATCH /api/contracts/[id] ─────────────────────────────────────────────────

describe("PATCH /api/contracts/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await PATCH(
      makeIdRequest("contract-uuid-1", { status: "TERMINATED" }),
      idParams("contract-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 200 with updated contract", async () => {
    mockGetToken.mockResolvedValue("token")
    const updated = { ...mockContract, status: "TERMINATED" as const }
    mockUpdate.mockResolvedValue(updated)
    const res = await PATCH(
      makeIdRequest("contract-uuid-1", { status: "TERMINATED" }),
      idParams("contract-uuid-1")
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(updated)
  })

  it("passes id and payload to backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockResolvedValue(mockContract)
    await PATCH(
      makeIdRequest("contract-uuid-1", { status: "TERMINATED" }),
      idParams("contract-uuid-1")
    )
    expect(mockUpdate).toHaveBeenCalledWith("token", "contract-uuid-1", { status: "TERMINATED" })
  })

  it("forwards 404 when contract not found", async () => {
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockRejectedValue(new ApiError(404, "Contract not found"))
    const res = await PATCH(makeIdRequest("bad-id", { status: "ACTIVE" }), idParams("bad-id"))
    expect(res.status).toBe(404)
  })

  it("forwards 409 when update conflicts with an existing active contract", async () => {
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockRejectedValue(
      new ApiError(409, "Property already has a different active contract")
    )
    const res = await PATCH(
      makeIdRequest("contract-uuid-1", { status: "ACTIVE" }),
      idParams("contract-uuid-1")
    )
    expect(res.status).toBe(409)
  })

  it("returns 500 on unexpected error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockRejectedValue(new Error("DB error"))
    const res = await PATCH(makeIdRequest("contract-uuid-1", {}), idParams("contract-uuid-1"))
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})

// ─── DELETE /api/contracts/[id] ────────────────────────────────────────────────

describe("DELETE /api/contracts/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await DELETE(
      makeIdRequest("contract-uuid-1", undefined, "DELETE"),
      idParams("contract-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 204 on successful delete", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockResolvedValue(undefined)
    const res = await DELETE(
      makeIdRequest("contract-uuid-1", undefined, "DELETE"),
      idParams("contract-uuid-1")
    )
    expect(res.status).toBe(204)
  })

  it("passes id to the backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockResolvedValue(undefined)
    await DELETE(makeIdRequest("contract-uuid-1", undefined, "DELETE"), idParams("contract-uuid-1"))
    expect(mockDelete).toHaveBeenCalledWith("token", "contract-uuid-1")
  })

  it("forwards 404 when contract not found", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockRejectedValue(new ApiError(404, "Contract not found"))
    const res = await DELETE(makeIdRequest("bad-id", undefined, "DELETE"), idParams("bad-id"))
    expect(res.status).toBe(404)
  })

  it("forwards 409 when contract is still referenced by a lease", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockRejectedValue(new ApiError(409, "Contract is still referenced by a lease"))
    const res = await DELETE(
      makeIdRequest("contract-uuid-1", undefined, "DELETE"),
      idParams("contract-uuid-1")
    )
    expect(res.status).toBe(409)
  })

  it("returns 500 on unexpected error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockRejectedValue(new Error("Unexpected"))
    const res = await DELETE(
      makeIdRequest("contract-uuid-1", undefined, "DELETE"),
      idParams("contract-uuid-1")
    )
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})
