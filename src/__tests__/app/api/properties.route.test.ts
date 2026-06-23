/**
 * @jest-environment node
 *
 * Tests for the properties Route Handlers:
 *   GET  /api/properties        → route.ts
 *   POST /api/properties        → route.ts
 *   PATCH  /api/properties/[id] → [id]/route.ts
 *   DELETE /api/properties/[id] → [id]/route.ts
 */

import { NextRequest } from "next/server"
import { ApiError } from "@/types"

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/api/propertiesBackend", () => ({
  backendListProperties: jest.fn(),
  backendCreateProperty: jest.fn(),
  backendUpdateProperty: jest.fn(),
  backendDeleteProperty: jest.fn(),
}))

jest.mock("@/lib/auth/session", () => ({
  getToken: jest.fn(),
}))

import * as backend from "@/lib/api/propertiesBackend"
import * as session from "@/lib/auth/session"
import { GET as listGET, POST as listPOST } from "@/app/api/properties/route"
import { PATCH, DELETE } from "@/app/api/properties/[id]/route"

const mockList = backend.backendListProperties as jest.MockedFunction<typeof backend.backendListProperties>
const mockCreate = backend.backendCreateProperty as jest.MockedFunction<typeof backend.backendCreateProperty>
const mockUpdate = backend.backendUpdateProperty as jest.MockedFunction<typeof backend.backendUpdateProperty>
const mockDelete = backend.backendDeleteProperty as jest.MockedFunction<typeof backend.backendDeleteProperty>
const mockGetToken = session.getToken as jest.MockedFunction<typeof session.getToken>

const mockProperty = {
  id: "prop-uuid-1",
  name: "Sunset Villa",
  address: "123 Main St, Laguna",
  description: "A lovely villa",
  status: "vacant" as const,
  is_active: true,
  manager_id: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

function makeRequest(body?: unknown, method = "GET") {
  return new NextRequest("http://localhost:3000/api/properties", {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : {}),
  })
}

function makeIdRequest(id: string, body?: unknown, method = "PATCH") {
  return new NextRequest(`http://localhost:3000/api/properties/${id}`, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : {}),
  })
}

const idParams = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET /api/properties ──────────────────────────────────────────────────────

describe("GET /api/properties", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await listGET()
    expect(res.status).toBe(401)
  })

  it("returns 200 with property list on success", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockList.mockResolvedValue([mockProperty])
    const res = await listGET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([mockProperty])
  })

  it("returns empty array when no properties exist", async () => {
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

  it("returns 401 detail in body", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await listGET()
    const body = await res.json()
    expect(body.detail).toBe("Not authenticated")
  })

  it("forwards backend ApiError status and detail", async () => {
    mockGetToken.mockResolvedValue("token")
    mockList.mockRejectedValue(new ApiError(403, "Forbidden"))
    const res = await listGET()
    expect(res.status).toBe(403)
    expect((await res.json()).detail).toBe("Forbidden")
  })

  it("returns 500 on unexpected backend error", async () => {
    mockGetToken.mockResolvedValue("token")
    mockList.mockRejectedValue(new Error("Database connection lost"))
    const res = await listGET()
    expect(res.status).toBe(500)
  })
})

// ─── POST /api/properties ─────────────────────────────────────────────────────

describe("POST /api/properties", () => {
  const payload = { name: "New Property", address: "456 Oak Ave", status: "vacant" }

  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(401)
  })

  it("returns 201 with created property on success", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockCreate.mockResolvedValue(mockProperty)
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(mockProperty)
  })

  it("passes payload to the backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockResolvedValue(mockProperty)
    await listPOST(makeRequest(payload, "POST"))
    expect(mockCreate).toHaveBeenCalledWith("token", payload)
  })

  it("forwards 403 when backend rejects non-admin", async () => {
    mockGetToken.mockResolvedValue("manager-token")
    mockCreate.mockRejectedValue(new ApiError(403, "Admin access required"))
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(403)
  })

  it("forwards 422 on validation error", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockRejectedValue(new ApiError(422, "name field required"))
    const res = await listPOST(makeRequest({ address: "No name" }, "POST"))
    expect(res.status).toBe(422)
  })

  it("returns 500 on unexpected error", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockRejectedValue(new Error("Unexpected"))
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(500)
  })
})

// ─── PATCH /api/properties/[id] ───────────────────────────────────────────────

describe("PATCH /api/properties/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await PATCH(makeIdRequest("prop-uuid-1", { name: "X" }), idParams("prop-uuid-1"))
    expect(res.status).toBe(401)
  })

  it("returns 200 with updated property", async () => {
    mockGetToken.mockResolvedValue("token")
    const updated = { ...mockProperty, name: "Updated Name" }
    mockUpdate.mockResolvedValue(updated)
    const res = await PATCH(makeIdRequest("prop-uuid-1", { name: "Updated Name" }), idParams("prop-uuid-1"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(updated)
  })

  it("passes id and payload to backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockResolvedValue(mockProperty)
    await PATCH(makeIdRequest("prop-uuid-1", { is_active: false }), idParams("prop-uuid-1"))
    expect(mockUpdate).toHaveBeenCalledWith("token", "prop-uuid-1", { is_active: false })
  })

  it("forwards 404 when property not found", async () => {
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockRejectedValue(new ApiError(404, "Property not found"))
    const res = await PATCH(makeIdRequest("bad-id", { name: "X" }), idParams("bad-id"))
    expect(res.status).toBe(404)
  })

  it("forwards 403 when non-admin tries to update", async () => {
    mockGetToken.mockResolvedValue("manager-token")
    mockUpdate.mockRejectedValue(new ApiError(403, "Forbidden"))
    const res = await PATCH(makeIdRequest("prop-uuid-1", { name: "X" }), idParams("prop-uuid-1"))
    expect(res.status).toBe(403)
  })

  it("returns 500 on unexpected error", async () => {
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockRejectedValue(new Error("DB error"))
    const res = await PATCH(makeIdRequest("prop-uuid-1", {}), idParams("prop-uuid-1"))
    expect(res.status).toBe(500)
  })
})

// ─── DELETE /api/properties/[id] ──────────────────────────────────────────────

describe("DELETE /api/properties/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await DELETE(makeIdRequest("prop-uuid-1", undefined, "DELETE"), idParams("prop-uuid-1"))
    expect(res.status).toBe(401)
  })

  it("returns 204 on successful delete", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockResolvedValue(undefined)
    const res = await DELETE(makeIdRequest("prop-uuid-1", undefined, "DELETE"), idParams("prop-uuid-1"))
    expect(res.status).toBe(204)
  })

  it("passes id to the backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockResolvedValue(undefined)
    await DELETE(makeIdRequest("prop-uuid-1", undefined, "DELETE"), idParams("prop-uuid-1"))
    expect(mockDelete).toHaveBeenCalledWith("token", "prop-uuid-1")
  })

  it("forwards 404 when property not found", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockRejectedValue(new ApiError(404, "Property not found"))
    const res = await DELETE(makeIdRequest("bad-id", undefined, "DELETE"), idParams("bad-id"))
    expect(res.status).toBe(404)
  })

  it("forwards 403 when non-admin tries to delete", async () => {
    mockGetToken.mockResolvedValue("manager-token")
    mockDelete.mockRejectedValue(new ApiError(403, "Forbidden"))
    const res = await DELETE(makeIdRequest("prop-uuid-1", undefined, "DELETE"), idParams("prop-uuid-1"))
    expect(res.status).toBe(403)
  })

  it("returns 500 on unexpected error", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockRejectedValue(new Error("Unexpected"))
    const res = await DELETE(makeIdRequest("prop-uuid-1", undefined, "DELETE"), idParams("prop-uuid-1"))
    expect(res.status).toBe(500)
  })
})
