/**
 * Tests for lib/api/contractsBackend.ts
 *
 * Covers the server-side detail-extraction logic used when the FastAPI
 * backend returns a non-2xx response. `detail` is an untrusted external
 * value — it can be any JSON type, so these cases are enumerated from the
 * JSON type space itself rather than from any one backend's observed shape.
 */

import { backendCreateContract } from "@/lib/api/contractsBackend"
import { ApiError } from "@/types"
import type { ContractCreatePayload } from "@/types/contract"

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
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

describe("contractsBackend detail extraction", () => {
  it("uses a plain string detail as-is", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Property already has an active contract" }, 409))
    await expect(backendCreateContract("token", createPayload)).rejects.toThrow(ApiError)
    try {
      await backendCreateContract("token", createPayload)
    } catch (err) {
      expect((err as ApiError).detail).toBe("Property already has an active contract")
    }
  })

  it("joins FastAPI's structured 422 validation error array by msg", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        {
          detail: [
            { loc: ["body", "tenant_id"], msg: "Input should be a valid UUID", type: "uuid_parsing" },
          ],
        },
        422
      )
    )
    try {
      await backendCreateContract("token", createPayload)
      throw new Error("expected backendCreateContract to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("Input should be a valid UUID")
    }
  })

  it("falls back to the generic message when detail is null", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: null }, 500))
    try {
      await backendCreateContract("token", createPayload)
      throw new Error("expected backendCreateContract to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("falls back to the generic message when detail is an empty array", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: [] }, 422))
    try {
      await backendCreateContract("token", createPayload)
      throw new Error("expected backendCreateContract to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("422")
    }
  })

  it("stringifies a numeric detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: 42 }, 500))
    try {
      await backendCreateContract("token", createPayload)
      throw new Error("expected backendCreateContract to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("42")
    }
  })

  it("stringifies a boolean detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: false }, 500))
    try {
      await backendCreateContract("token", createPayload)
      throw new Error("expected backendCreateContract to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("false")
    }
  })

  it("joins an array of plain strings", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: ["first problem", "second problem"] }, 422))
    try {
      await backendCreateContract("token", createPayload)
      throw new Error("expected backendCreateContract to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("first problem; second problem")
    }
  })

  it("JSON-stringifies array entries that have no msg field", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ detail: [{ code: "E_CONFLICT", loc: ["body", "status"] }] }, 422)
    )
    try {
      await backendCreateContract("token", createPayload)
      throw new Error("expected backendCreateContract to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(
        JSON.stringify({ code: "E_CONFLICT", loc: ["body", "status"] })
      )
    }
  })

  it("extracts msg from a single (non-array) error object", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { msg: "single structured error" } }, 422))
    try {
      await backendCreateContract("token", createPayload)
      throw new Error("expected backendCreateContract to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("single structured error")
    }
  })

  it("JSON-stringifies a plain object detail with no msg field", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { code: "E_CONFLICT" } }, 409))
    try {
      await backendCreateContract("token", createPayload)
      throw new Error("expected backendCreateContract to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(JSON.stringify({ code: "E_CONFLICT" }))
    }
  })
})
