/**
 * Tests for lib/api/tenants.ts
 *
 * Covers the client-side tenantsApi that calls Next.js Route Handlers.
 * All fetch calls are mocked — we're testing the client logic, not the network.
 */

import { tenantsApi } from "@/lib/api/tenants"
import { ApiError } from "@/types"
import type { Tenant, TenantCreatePayload } from "@/types/tenant"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

function mockEmptyResponse(status = 204) {
  return Promise.resolve({
    ok: true,
    status,
    json: () => Promise.reject(new Error("No body")),
  } as Response)
}

const mockTenant: Tenant = {
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

const createPayload: TenantCreatePayload = {
  full_name: "Jane Doe",
  email: "jane@example.com",
  phone_number: "+63 900 000 0000",
  date_of_birth: "1995-01-01",
  current_address: "123 Main St, Manila",
}

beforeEach(() => {
  mockFetch.mockReset()
})

// ─── list ─────────────────────────────────────────────────────────────────────

describe("tenantsApi.list", () => {
  it("calls GET /api/tenants", async () => {
    mockFetch.mockReturnValue(mockResponse([]))
    await tenantsApi.list()
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tenants",
      expect.objectContaining({ headers: expect.any(Object) })
    )
  })

  it("returns an array of tenants", async () => {
    mockFetch.mockReturnValue(mockResponse([mockTenant]))
    const result = await tenantsApi.list()
    expect(result).toEqual([mockTenant])
  })

  it("returns empty array when no tenants exist", async () => {
    mockFetch.mockReturnValue(mockResponse([]))
    const result = await tenantsApi.list()
    expect(result).toEqual([])
  })

  it("throws ApiError on 401", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(tenantsApi.list()).rejects.toThrow(ApiError)
  })

  it("throws ApiError with correct status and detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    try {
      await tenantsApi.list()
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(401)
      expect((err as ApiError).detail).toBe("Not authenticated")
    }
  })

  it("falls back to status message when response body has no detail field", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) } as Response)
    )
    try {
      await tenantsApi.list()
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })
})

// ─── get ──────────────────────────────────────────────────────────────────────

describe("tenantsApi.get", () => {
  it("calls GET /api/tenants/:id", async () => {
    mockFetch.mockReturnValue(mockResponse(mockTenant))
    await tenantsApi.get("tenant-uuid-1")
    expect(mockFetch).toHaveBeenCalledWith("/api/tenants/tenant-uuid-1", expect.any(Object))
  })

  it("returns the tenant", async () => {
    mockFetch.mockReturnValue(mockResponse(mockTenant))
    const result = await tenantsApi.get("tenant-uuid-1")
    expect(result).toEqual(mockTenant)
  })

  it("throws ApiError on 404 when tenant not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Tenant not found" }, 404))
    await expect(tenantsApi.get("nonexistent")).rejects.toThrow(ApiError)
  })
})

// ─── create ───────────────────────────────────────────────────────────────────

describe("tenantsApi.create", () => {
  it("calls POST /api/tenants with correct body", async () => {
    mockFetch.mockReturnValue(mockResponse(mockTenant, 201))
    await tenantsApi.create(createPayload)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tenants",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(createPayload),
      })
    )
  })

  it("returns the created tenant", async () => {
    mockFetch.mockReturnValue(mockResponse(mockTenant, 201))
    const result = await tenantsApi.create(createPayload)
    expect(result).toEqual(mockTenant)
  })

  it("throws ApiError on 401 when unauthenticated", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(tenantsApi.create(createPayload)).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 422 validation error", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "value is not a valid email address" }, 422))
    await expect(tenantsApi.create({ ...createPayload, email: "not-an-email" })).rejects.toThrow(
      ApiError
    )
  })

  it("throws ApiError on 409 when a tenant with this email already exists", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ detail: "Tenant with this email already exists" }, 409)
    )
    await expect(tenantsApi.create(createPayload)).rejects.toThrow(ApiError)
  })

  it("extracts a readable message from FastAPI's structured 422 validation error array", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        {
          detail: [
            {
              loc: ["body", "email"],
              msg: "value is not a valid email address",
              type: "value_error",
            },
          ],
        },
        422
      )
    )
    try {
      await tenantsApi.create({ ...createPayload, email: "not-an-email" })
      throw new Error("expected tenantsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("value is not a valid email address")
    }
  })

  it("joins multiple FastAPI validation errors into one readable message", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        {
          detail: [
            {
              loc: ["body", "email"],
              msg: "value is not a valid email address",
              type: "value_error",
            },
            {
              loc: ["body", "phone_number"],
              msg: "field required",
              type: "missing",
            },
          ],
        },
        422
      )
    )
    try {
      await tenantsApi.create(createPayload)
      throw new Error("expected tenantsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("value is not a valid email address; field required")
    }
  })

  // ── detail type-space edge cases ──────────────────────────────────────────
  // `detail` comes from an untrusted external response — it can be any JSON
  // value, not just the string/array-of-{msg} shapes we happen to have seen.
  // These cases are enumerated from the JSON type space itself, independent
  // of what any particular backend actually sends.

  it("falls back to the generic message when detail is null", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: null }, 500))
    try {
      await tenantsApi.create(createPayload)
      throw new Error("expected tenantsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("falls back to the generic message when detail is missing entirely", async () => {
    mockFetch.mockReturnValue(mockResponse({}, 500))
    try {
      await tenantsApi.create(createPayload)
      throw new Error("expected tenantsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("falls back to the generic message when detail is an empty array", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: [] }, 422))
    try {
      await tenantsApi.create(createPayload)
      throw new Error("expected tenantsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("422")
    }
  })

  it("stringifies a numeric detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: 42 }, 500))
    try {
      await tenantsApi.create(createPayload)
      throw new Error("expected tenantsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("42")
    }
  })

  it("stringifies a boolean detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: false }, 500))
    try {
      await tenantsApi.create(createPayload)
      throw new Error("expected tenantsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("false")
    }
  })

  it("joins an array of plain strings", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: ["first problem", "second problem"] }, 422))
    try {
      await tenantsApi.create(createPayload)
      throw new Error("expected tenantsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("first problem; second problem")
    }
  })

  it("JSON-stringifies array entries that have no msg field", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ detail: [{ code: "E_CONFLICT", loc: ["body", "email"] }] }, 422)
    )
    try {
      await tenantsApi.create(createPayload)
      throw new Error("expected tenantsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(
        JSON.stringify({ code: "E_CONFLICT", loc: ["body", "email"] })
      )
    }
  })

  it("extracts msg from a single (non-array) error object", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { msg: "single structured error" } }, 422))
    try {
      await tenantsApi.create(createPayload)
      throw new Error("expected tenantsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("single structured error")
    }
  })

  it("JSON-stringifies a plain object detail with no msg field", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { code: "E_CONFLICT" } }, 409))
    try {
      await tenantsApi.create(createPayload)
      throw new Error("expected tenantsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(JSON.stringify({ code: "E_CONFLICT" }))
    }
  })
})

// ─── update ───────────────────────────────────────────────────────────────────

describe("tenantsApi.update", () => {
  it("calls PATCH /api/tenants/:id", async () => {
    mockFetch.mockReturnValue(mockResponse(mockTenant))
    await tenantsApi.update("tenant-uuid-1", { is_active: false })
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tenants/tenant-uuid-1",
      expect.objectContaining({ method: "PATCH" })
    )
  })

  it("sends only the provided fields", async () => {
    mockFetch.mockReturnValue(mockResponse(mockTenant))
    await tenantsApi.update("tenant-uuid-1", { is_active: false })
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tenants/tenant-uuid-1",
      expect.objectContaining({ body: JSON.stringify({ is_active: false }) })
    )
  })

  it("returns the updated tenant", async () => {
    const updated = { ...mockTenant, is_active: false }
    mockFetch.mockReturnValue(mockResponse(updated))
    const result = await tenantsApi.update("tenant-uuid-1", { is_active: false })
    expect(result).toEqual(updated)
  })

  it("throws ApiError on 404 when tenant not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Tenant not found" }, 404))
    await expect(tenantsApi.update("nonexistent", { is_active: false })).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 409 when update conflicts with an existing tenant", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ detail: "Tenant with this email already exists" }, 409)
    )
    await expect(
      tenantsApi.update("tenant-uuid-1", { email: "taken@example.com" })
    ).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 401 when unauthenticated", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(tenantsApi.update("tenant-uuid-1", {})).rejects.toThrow(ApiError)
  })
})

// ─── delete ───────────────────────────────────────────────────────────────────

describe("tenantsApi.delete", () => {
  it("calls DELETE /api/tenants/:id", async () => {
    mockFetch.mockReturnValue(mockEmptyResponse(204))
    await tenantsApi.delete("tenant-uuid-1")
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tenants/tenant-uuid-1",
      expect.objectContaining({ method: "DELETE" })
    )
  })

  it("resolves without error on 204", async () => {
    mockFetch.mockReturnValue(mockEmptyResponse(204))
    await expect(tenantsApi.delete("tenant-uuid-1")).resolves.toBeUndefined()
  })

  it("throws ApiError on 404 when tenant not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Tenant not found" }, 404))
    await expect(tenantsApi.delete("nonexistent")).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 409 when tenant is still referenced by a contract", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ detail: "Tenant is still referenced by a contract" }, 409)
    )
    await expect(tenantsApi.delete("tenant-uuid-1")).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 401 when unauthenticated", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(tenantsApi.delete("tenant-uuid-1")).rejects.toThrow(ApiError)
  })
})
