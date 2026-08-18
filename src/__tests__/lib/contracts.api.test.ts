/**
 * Tests for lib/api/contracts.ts
 *
 * Covers the client-side contractsApi that calls Next.js Route Handlers.
 * All fetch calls are mocked — we're testing the client logic, not the network.
 */

import { contractsApi } from "@/lib/api/contracts"
import { ApiError } from "@/types"
import type { Contract, ContractCreatePayload } from "@/types/contract"

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

const mockContract: Contract = {
  id: "contract-uuid-1",
  property_id: "prop-uuid-1",
  tenant_id: "tenant-uuid-1",
  rental_type: "long_term",
  start_date: "2026-01-01",
  end_date: null,
  rent_amount: "15000.00",
  deposit: "30000.00",
  booking_source: "direct",
  status: "ACTIVE",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const createPayload: ContractCreatePayload = {
  property_id: "prop-uuid-1",
  tenant_id: "tenant-uuid-1",
  rental_type: "long_term",
  start_date: "2026-01-01",
  rent_amount: "15000.00",
}

beforeEach(() => {
  mockFetch.mockReset()
})

// ─── list ─────────────────────────────────────────────────────────────────────

describe("contractsApi.list", () => {
  it("calls GET /api/contracts", async () => {
    mockFetch.mockReturnValue(mockResponse([]))
    await contractsApi.list()
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/contracts",
      expect.objectContaining({ headers: expect.any(Object) })
    )
  })

  it("returns an array of contracts", async () => {
    mockFetch.mockReturnValue(mockResponse([mockContract]))
    const result = await contractsApi.list()
    expect(result).toEqual([mockContract])
  })

  it("returns empty array when no contracts exist", async () => {
    mockFetch.mockReturnValue(mockResponse([]))
    const result = await contractsApi.list()
    expect(result).toEqual([])
  })

  it("throws ApiError on 401", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(contractsApi.list()).rejects.toThrow(ApiError)
  })

  it("throws ApiError with correct status and detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    try {
      await contractsApi.list()
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
      await contractsApi.list()
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })
})

// ─── get ──────────────────────────────────────────────────────────────────────

describe("contractsApi.get", () => {
  it("calls GET /api/contracts/:id", async () => {
    mockFetch.mockReturnValue(mockResponse(mockContract))
    await contractsApi.get("contract-uuid-1")
    expect(mockFetch).toHaveBeenCalledWith("/api/contracts/contract-uuid-1", expect.any(Object))
  })

  it("returns the contract", async () => {
    mockFetch.mockReturnValue(mockResponse(mockContract))
    const result = await contractsApi.get("contract-uuid-1")
    expect(result).toEqual(mockContract)
  })

  it("throws ApiError on 404 when contract not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Contract not found" }, 404))
    await expect(contractsApi.get("nonexistent")).rejects.toThrow(ApiError)
  })
})

// ─── create ───────────────────────────────────────────────────────────────────

describe("contractsApi.create", () => {
  it("calls POST /api/contracts with correct body", async () => {
    mockFetch.mockReturnValue(mockResponse(mockContract, 201))
    await contractsApi.create(createPayload)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/contracts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(createPayload),
      })
    )
  })

  it("returns the created contract", async () => {
    mockFetch.mockReturnValue(mockResponse(mockContract, 201))
    const result = await contractsApi.create(createPayload)
    expect(result).toEqual(mockContract)
  })

  it("throws ApiError on 401 when unauthenticated", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(contractsApi.create(createPayload)).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 422 validation error", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "rent_amount must be greater than 0" }, 422))
    await expect(contractsApi.create({ ...createPayload, rent_amount: "-1" })).rejects.toThrow(
      ApiError
    )
  })

  it("throws ApiError on 409 when property already has an active contract", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ detail: "Property already has an active contract" }, 409)
    )
    await expect(contractsApi.create(createPayload)).rejects.toThrow(ApiError)
  })

  it("extracts a readable message from FastAPI's structured 422 validation error array", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        {
          detail: [
            {
              loc: ["body", "tenant_id"],
              msg: "Input should be a valid UUID, invalid character found",
              type: "uuid_parsing",
            },
          ],
        },
        422
      )
    )
    try {
      await contractsApi.create({ ...createPayload, tenant_id: "not-a-uuid" })
      throw new Error("expected contractsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("Input should be a valid UUID, invalid character found")
    }
  })

  it("joins multiple FastAPI validation errors into one readable message", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        {
          detail: [
            { loc: ["body", "tenant_id"], msg: "Input should be a valid UUID", type: "uuid_parsing" },
            {
              loc: ["body", "rent_amount"],
              msg: "Input should be greater than 0",
              type: "greater_than",
            },
          ],
        },
        422
      )
    )
    try {
      await contractsApi.create(createPayload)
      throw new Error("expected contractsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(
        "Input should be a valid UUID; Input should be greater than 0"
      )
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
      await contractsApi.create(createPayload)
      throw new Error("expected contractsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("falls back to the generic message when detail is missing entirely", async () => {
    mockFetch.mockReturnValue(mockResponse({}, 500))
    try {
      await contractsApi.create(createPayload)
      throw new Error("expected contractsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("falls back to the generic message when detail is an empty array", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: [] }, 422))
    try {
      await contractsApi.create(createPayload)
      throw new Error("expected contractsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("422")
    }
  })

  it("stringifies a numeric detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: 42 }, 500))
    try {
      await contractsApi.create(createPayload)
      throw new Error("expected contractsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("42")
    }
  })

  it("stringifies a boolean detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: false }, 500))
    try {
      await contractsApi.create(createPayload)
      throw new Error("expected contractsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("false")
    }
  })

  it("joins an array of plain strings", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: ["first problem", "second problem"] }, 422))
    try {
      await contractsApi.create(createPayload)
      throw new Error("expected contractsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("first problem; second problem")
    }
  })

  it("JSON-stringifies array entries that have no msg field", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ detail: [{ code: "E_CONFLICT", loc: ["body", "status"] }] }, 422)
    )
    try {
      await contractsApi.create(createPayload)
      throw new Error("expected contractsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(
        JSON.stringify({ code: "E_CONFLICT", loc: ["body", "status"] })
      )
    }
  })

  it("extracts msg from a single (non-array) error object", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { msg: "single structured error" } }, 422))
    try {
      await contractsApi.create(createPayload)
      throw new Error("expected contractsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("single structured error")
    }
  })

  it("JSON-stringifies a plain object detail with no msg field", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { code: "E_CONFLICT" } }, 409))
    try {
      await contractsApi.create(createPayload)
      throw new Error("expected contractsApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(JSON.stringify({ code: "E_CONFLICT" }))
    }
  })
})

// ─── update ───────────────────────────────────────────────────────────────────

describe("contractsApi.update", () => {
  it("calls PATCH /api/contracts/:id", async () => {
    mockFetch.mockReturnValue(mockResponse(mockContract))
    await contractsApi.update("contract-uuid-1", { status: "TERMINATED" })
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/contracts/contract-uuid-1",
      expect.objectContaining({ method: "PATCH" })
    )
  })

  it("sends only the provided fields", async () => {
    mockFetch.mockReturnValue(mockResponse(mockContract))
    await contractsApi.update("contract-uuid-1", { status: "TERMINATED" })
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/contracts/contract-uuid-1",
      expect.objectContaining({ body: JSON.stringify({ status: "TERMINATED" }) })
    )
  })

  it("returns the updated contract", async () => {
    const updated = { ...mockContract, status: "TERMINATED" as const }
    mockFetch.mockReturnValue(mockResponse(updated))
    const result = await contractsApi.update("contract-uuid-1", { status: "TERMINATED" })
    expect(result).toEqual(updated)
  })

  it("throws ApiError on 404 when contract not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Contract not found" }, 404))
    await expect(contractsApi.update("nonexistent", { status: "TERMINATED" })).rejects.toThrow(
      ApiError
    )
  })

  it("throws ApiError on 409 when update conflicts with an existing active contract", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ detail: "Property already has a different active contract" }, 409)
    )
    await expect(contractsApi.update("contract-uuid-1", { status: "ACTIVE" })).rejects.toThrow(
      ApiError
    )
  })

  it("throws ApiError on 401 when unauthenticated", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(contractsApi.update("contract-uuid-1", {})).rejects.toThrow(ApiError)
  })
})

// ─── delete ───────────────────────────────────────────────────────────────────

describe("contractsApi.delete", () => {
  it("calls DELETE /api/contracts/:id", async () => {
    mockFetch.mockReturnValue(mockEmptyResponse(204))
    await contractsApi.delete("contract-uuid-1")
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/contracts/contract-uuid-1",
      expect.objectContaining({ method: "DELETE" })
    )
  })

  it("resolves without error on 204", async () => {
    mockFetch.mockReturnValue(mockEmptyResponse(204))
    await expect(contractsApi.delete("contract-uuid-1")).resolves.toBeUndefined()
  })

  it("throws ApiError on 404 when contract not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Contract not found" }, 404))
    await expect(contractsApi.delete("nonexistent")).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 409 when contract is still referenced by a lease", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ detail: "Contract is still referenced by a lease" }, 409)
    )
    await expect(contractsApi.delete("contract-uuid-1")).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 401 when unauthenticated", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(contractsApi.delete("contract-uuid-1")).rejects.toThrow(ApiError)
  })
})
