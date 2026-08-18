/**
 * @jest-environment node
 *
 * Tests for the tenants Route Handlers:
 *   GET  /api/tenants        → route.ts
 *   POST /api/tenants        → route.ts
 *   GET    /api/tenants/[id] → [id]/route.ts
 *   PATCH  /api/tenants/[id] → [id]/route.ts
 *   DELETE /api/tenants/[id] → [id]/route.ts
 */

import { NextRequest } from "next/server"
import { ApiError } from "@/types"

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/api/tenantsBackend", () => ({
  backendListTenants: jest.fn(),
  backendGetTenant: jest.fn(),
  backendCreateTenant: jest.fn(),
  backendUpdateTenant: jest.fn(),
  backendDeleteTenant: jest.fn(),
}))

jest.mock("@/lib/auth/session", () => ({
  getToken: jest.fn(),
}))

import * as backend from "@/lib/api/tenantsBackend"
import * as session from "@/lib/auth/session"
import { GET as listGET, POST as listPOST } from "@/app/api/tenants/route"
import { GET as getGET, PATCH, DELETE } from "@/app/api/tenants/[id]/route"

const mockList = backend.backendListTenants as jest.MockedFunction<
  typeof backend.backendListTenants
>
const mockGet = backend.backendGetTenant as jest.MockedFunction<typeof backend.backendGetTenant>
const mockCreate = backend.backendCreateTenant as jest.MockedFunction<
  typeof backend.backendCreateTenant
>
const mockUpdate = backend.backendUpdateTenant as jest.MockedFunction<
  typeof backend.backendUpdateTenant
>
const mockDelete = backend.backendDeleteTenant as jest.MockedFunction<
  typeof backend.backendDeleteTenant
>
const mockGetToken = session.getToken as jest.MockedFunction<typeof session.getToken>

const mockTenant = {
  id: "tenant-uuid-1",
  full_name: "Jane Doe",
  email: "jane@example.com",
  phone_number: "+63 900 000 0000",
  date_of_birth: "1995-01-01",
  current_address: "123 Main St, Manila",
  occupation: "Software Engineer",
  notes: null,
  is_active: true,
  user_id: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

function makeRequest(body?: unknown, method = "GET") {
  return new NextRequest("http://localhost:3000/api/tenants", {
    method,
    ...(body
      ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }
      : {}),
  })
}

function makeIdRequest(id: string, body?: unknown, method = "PATCH") {
  return new NextRequest(`http://localhost:3000/api/tenants/${id}`, {
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

// ─── GET /api/tenants ───────────────────────────────────────────────────────────

describe("GET /api/tenants", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await listGET()
    expect(res.status).toBe(401)
  })

  it("returns 200 with tenant list on success", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockList.mockResolvedValue([mockTenant])
    const res = await listGET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([mockTenant])
  })

  it("returns empty array when no tenants exist", async () => {
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

// ─── POST /api/tenants ──────────────────────────────────────────────────────────

describe("POST /api/tenants", () => {
  const payload = {
    full_name: "Jane Doe",
    email: "jane@example.com",
    phone_number: "+63 900 000 0000",
    date_of_birth: "1995-01-01",
    current_address: "123 Main St, Manila",
  }

  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(401)
  })

  it("returns 201 with created tenant on success", async () => {
    mockGetToken.mockResolvedValue("valid-token")
    mockCreate.mockResolvedValue(mockTenant)
    const res = await listPOST(makeRequest(payload, "POST"))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(mockTenant)
  })

  it("passes payload to the backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockResolvedValue(mockTenant)
    await listPOST(makeRequest(payload, "POST"))
    expect(mockCreate).toHaveBeenCalledWith("token", payload)
  })

  it("forwards 422 on validation error", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockRejectedValue(new ApiError(422, "value is not a valid email address"))
    const res = await listPOST(makeRequest({ ...payload, email: "not-an-email" }, "POST"))
    expect(res.status).toBe(422)
  })

  it("forwards 409 when a tenant with this email already exists", async () => {
    mockGetToken.mockResolvedValue("token")
    mockCreate.mockRejectedValue(new ApiError(409, "Tenant with this email already exists"))
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

// ─── GET /api/tenants/[id] ──────────────────────────────────────────────────────

describe("GET /api/tenants/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await getGET(
      makeIdRequest("tenant-uuid-1", undefined, "GET"),
      idParams("tenant-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 200 with tenant on success", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGet.mockResolvedValue(mockTenant)
    const res = await getGET(
      makeIdRequest("tenant-uuid-1", undefined, "GET"),
      idParams("tenant-uuid-1")
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(mockTenant)
  })

  it("forwards 404 when tenant not found", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGet.mockRejectedValue(new ApiError(404, "Tenant not found"))
    const res = await getGET(makeIdRequest("bad-id", undefined, "GET"), idParams("bad-id"))
    expect(res.status).toBe(404)
  })
})

// ─── PATCH /api/tenants/[id] ────────────────────────────────────────────────────

describe("PATCH /api/tenants/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await PATCH(
      makeIdRequest("tenant-uuid-1", { is_active: false }),
      idParams("tenant-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 200 with updated tenant", async () => {
    mockGetToken.mockResolvedValue("token")
    const updated = { ...mockTenant, is_active: false }
    mockUpdate.mockResolvedValue(updated)
    const res = await PATCH(
      makeIdRequest("tenant-uuid-1", { is_active: false }),
      idParams("tenant-uuid-1")
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(updated)
  })

  it("passes id and payload to backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockResolvedValue(mockTenant)
    await PATCH(makeIdRequest("tenant-uuid-1", { is_active: false }), idParams("tenant-uuid-1"))
    expect(mockUpdate).toHaveBeenCalledWith("token", "tenant-uuid-1", { is_active: false })
  })

  it("forwards 404 when tenant not found", async () => {
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockRejectedValue(new ApiError(404, "Tenant not found"))
    const res = await PATCH(makeIdRequest("bad-id", { is_active: false }), idParams("bad-id"))
    expect(res.status).toBe(404)
  })

  it("forwards 409 when update conflicts with an existing tenant", async () => {
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockRejectedValue(new ApiError(409, "Tenant with this email already exists"))
    const res = await PATCH(
      makeIdRequest("tenant-uuid-1", { email: "taken@example.com" }),
      idParams("tenant-uuid-1")
    )
    expect(res.status).toBe(409)
  })

  it("returns 500 on unexpected error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockUpdate.mockRejectedValue(new Error("DB error"))
    const res = await PATCH(makeIdRequest("tenant-uuid-1", {}), idParams("tenant-uuid-1"))
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})

// ─── DELETE /api/tenants/[id] ───────────────────────────────────────────────────

describe("DELETE /api/tenants/[id]", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await DELETE(
      makeIdRequest("tenant-uuid-1", undefined, "DELETE"),
      idParams("tenant-uuid-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 204 on successful delete", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockResolvedValue(undefined)
    const res = await DELETE(
      makeIdRequest("tenant-uuid-1", undefined, "DELETE"),
      idParams("tenant-uuid-1")
    )
    expect(res.status).toBe(204)
  })

  it("passes id to the backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockResolvedValue(undefined)
    await DELETE(makeIdRequest("tenant-uuid-1", undefined, "DELETE"), idParams("tenant-uuid-1"))
    expect(mockDelete).toHaveBeenCalledWith("token", "tenant-uuid-1")
  })

  it("forwards 404 when tenant not found", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockRejectedValue(new ApiError(404, "Tenant not found"))
    const res = await DELETE(makeIdRequest("bad-id", undefined, "DELETE"), idParams("bad-id"))
    expect(res.status).toBe(404)
  })

  it("forwards 409 when tenant is still referenced by a contract", async () => {
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockRejectedValue(new ApiError(409, "Tenant is still referenced by a contract"))
    const res = await DELETE(
      makeIdRequest("tenant-uuid-1", undefined, "DELETE"),
      idParams("tenant-uuid-1")
    )
    expect(res.status).toBe(409)
  })

  it("returns 500 on unexpected error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockDelete.mockRejectedValue(new Error("Unexpected"))
    const res = await DELETE(
      makeIdRequest("tenant-uuid-1", undefined, "DELETE"),
      idParams("tenant-uuid-1")
    )
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})
