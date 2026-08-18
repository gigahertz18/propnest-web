/**
 * Tests for lib/api/leases.ts
 *
 * Covers the client-side leasesApi that calls Next.js Route Handlers.
 * All fetch calls are mocked — we're testing the client logic, not the network.
 */

import { leasesApi } from "@/lib/api/leases"
import { ApiError } from "@/types"
import type { Lease, LeaseCreatePayload } from "@/types/lease"

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

const mockLease: Lease = {
  id: "lease-uuid-1",
  contract_id: "contract-uuid-1",
  monthly_rent: "15000.00",
  due_day: 5,
  billing_cycle: "monthly",
  security_deposit: "30000.00",
  advance_payment: null,
  late_fee_amount: null,
  late_fee_percent: null,
  grace_period_days: 0,
  renewal_option: "none",
  status: "ACTIVE",
  start_date: "2026-01-01",
  end_date: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const createPayload: LeaseCreatePayload = {
  contract_id: "contract-uuid-1",
  monthly_rent: "15000.00",
  due_day: 5,
  start_date: "2026-01-01",
}

beforeEach(() => {
  mockFetch.mockReset()
})

// ─── list ─────────────────────────────────────────────────────────────────────

describe("leasesApi.list", () => {
  it("calls GET /api/leases", async () => {
    mockFetch.mockReturnValue(mockResponse([]))
    await leasesApi.list()
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/leases",
      expect.objectContaining({ headers: expect.any(Object) })
    )
  })

  it("returns an array of leases", async () => {
    mockFetch.mockReturnValue(mockResponse([mockLease]))
    const result = await leasesApi.list()
    expect(result).toEqual([mockLease])
  })

  it("returns empty array when no leases exist", async () => {
    mockFetch.mockReturnValue(mockResponse([]))
    const result = await leasesApi.list()
    expect(result).toEqual([])
  })

  it("throws ApiError on 401", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(leasesApi.list()).rejects.toThrow(ApiError)
  })
})

// ─── get ──────────────────────────────────────────────────────────────────────

describe("leasesApi.get", () => {
  it("calls GET /api/leases/:id", async () => {
    mockFetch.mockReturnValue(mockResponse(mockLease))
    await leasesApi.get("lease-uuid-1")
    expect(mockFetch).toHaveBeenCalledWith("/api/leases/lease-uuid-1", expect.any(Object))
  })

  it("returns the lease", async () => {
    mockFetch.mockReturnValue(mockResponse(mockLease))
    const result = await leasesApi.get("lease-uuid-1")
    expect(result).toEqual(mockLease)
  })

  it("throws ApiError on 404 when lease not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Lease not found" }, 404))
    await expect(leasesApi.get("nonexistent")).rejects.toThrow(ApiError)
  })
})

// ─── create ───────────────────────────────────────────────────────────────────

describe("leasesApi.create", () => {
  it("calls POST /api/leases with correct body", async () => {
    mockFetch.mockReturnValue(mockResponse(mockLease, 201))
    await leasesApi.create(createPayload)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/leases",
      expect.objectContaining({ method: "POST", body: JSON.stringify(createPayload) })
    )
  })

  it("returns the created lease", async () => {
    mockFetch.mockReturnValue(mockResponse(mockLease, 201))
    const result = await leasesApi.create(createPayload)
    expect(result).toEqual(mockLease)
  })

  it("throws ApiError on 400 when the rental type doesn't match the contract's terms", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Lease requires a long-term contract" }, 400))
    await expect(leasesApi.create(createPayload)).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 409 when the contract already has a lease", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Contract already has a lease" }, 409))
    await expect(leasesApi.create(createPayload)).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 422 validation error", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "due_day must be between 1 and 31" }, 422))
    await expect(leasesApi.create({ ...createPayload, due_day: 40 })).rejects.toThrow(ApiError)
  })

  // ── detail type-space edge cases ──────────────────────────────────────────
  it("falls back to the generic message when detail is null", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: null }, 500))
    try {
      await leasesApi.create(createPayload)
      throw new Error("expected leasesApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("falls back to the generic message when detail is missing entirely", async () => {
    mockFetch.mockReturnValue(mockResponse({}, 500))
    try {
      await leasesApi.create(createPayload)
      throw new Error("expected leasesApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("falls back to the generic message when detail is an empty array", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: [] }, 422))
    try {
      await leasesApi.create(createPayload)
      throw new Error("expected leasesApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("422")
    }
  })

  it("stringifies a numeric detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: 42 }, 500))
    try {
      await leasesApi.create(createPayload)
      throw new Error("expected leasesApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("42")
    }
  })

  it("stringifies a boolean detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: false }, 500))
    try {
      await leasesApi.create(createPayload)
      throw new Error("expected leasesApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("false")
    }
  })

  it("joins an array of plain strings", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: ["first problem", "second problem"] }, 422))
    try {
      await leasesApi.create(createPayload)
      throw new Error("expected leasesApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("first problem; second problem")
    }
  })

  it("JSON-stringifies array entries that have no msg field", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ detail: [{ code: "E_CONFLICT", loc: ["body", "status"] }] }, 422)
    )
    try {
      await leasesApi.create(createPayload)
      throw new Error("expected leasesApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(
        JSON.stringify({ code: "E_CONFLICT", loc: ["body", "status"] })
      )
    }
  })

  it("extracts msg from a single (non-array) error object", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { msg: "single structured error" } }, 422))
    try {
      await leasesApi.create(createPayload)
      throw new Error("expected leasesApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("single structured error")
    }
  })

  it("JSON-stringifies a plain object detail with no msg field", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { code: "E_CONFLICT" } }, 409))
    try {
      await leasesApi.create(createPayload)
      throw new Error("expected leasesApi.create to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(JSON.stringify({ code: "E_CONFLICT" }))
    }
  })
})

// ─── update ───────────────────────────────────────────────────────────────────

describe("leasesApi.update", () => {
  it("calls PATCH /api/leases/:id", async () => {
    mockFetch.mockReturnValue(mockResponse(mockLease))
    await leasesApi.update("lease-uuid-1", { status: "ENDED" })
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/leases/lease-uuid-1",
      expect.objectContaining({ method: "PATCH" })
    )
  })

  it("sends only the provided fields", async () => {
    mockFetch.mockReturnValue(mockResponse(mockLease))
    await leasesApi.update("lease-uuid-1", { status: "ENDED" })
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/leases/lease-uuid-1",
      expect.objectContaining({ body: JSON.stringify({ status: "ENDED" }) })
    )
  })

  it("returns the updated lease", async () => {
    const updated = { ...mockLease, status: "ENDED" as const }
    mockFetch.mockReturnValue(mockResponse(updated))
    const result = await leasesApi.update("lease-uuid-1", { status: "ENDED" })
    expect(result).toEqual(updated)
  })

  it("throws ApiError on 404 when lease not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Lease not found" }, 404))
    await expect(leasesApi.update("nonexistent", { status: "ENDED" })).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 401 when unauthenticated", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(leasesApi.update("lease-uuid-1", {})).rejects.toThrow(ApiError)
  })
})

// ─── delete ───────────────────────────────────────────────────────────────────

describe("leasesApi.delete", () => {
  it("calls DELETE /api/leases/:id", async () => {
    mockFetch.mockReturnValue(mockEmptyResponse(204))
    await leasesApi.delete("lease-uuid-1")
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/leases/lease-uuid-1",
      expect.objectContaining({ method: "DELETE" })
    )
  })

  it("resolves without error on 204", async () => {
    mockFetch.mockReturnValue(mockEmptyResponse(204))
    await expect(leasesApi.delete("lease-uuid-1")).resolves.toBeUndefined()
  })

  it("throws ApiError on 404 when lease not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Lease not found" }, 404))
    await expect(leasesApi.delete("nonexistent")).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 401 when unauthenticated", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(leasesApi.delete("lease-uuid-1")).rejects.toThrow(ApiError)
  })
})
