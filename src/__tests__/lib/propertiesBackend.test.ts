/**
 * Tests for lib/api/propertiesBackend.ts
 *
 * Covers the server-side calls to FastAPI property endpoints, including the
 * detail-extraction logic used when the backend returns a non-2xx response.
 * `detail` is an untrusted external value — it can be any JSON type, so these
 * cases are enumerated from the JSON type space itself rather than from any
 * one backend's observed shape.
 */

import {
  backendListProperties,
  backendCreateProperty,
  backendUploadPropertyImage,
} from "@/lib/api/propertiesBackend"
import type { ApiError } from "@/types"
import type { PropertyCreatePayload } from "@/types/property"

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

const createPayload: PropertyCreatePayload = {
  name: "Sunset Villa",
  address: "123 Main St, Laguna",
  description: "A lovely villa",
  status: "vacant",
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe("propertiesBackend detail extraction", () => {
  it("uses a plain string detail as-is", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Property already exists" }, 409))
    try {
      await backendCreateProperty("token", createPayload)
      throw new Error("expected backendCreateProperty to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("Property already exists")
    }
  })

  it("joins FastAPI's structured 422 validation error array by msg", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        { detail: [{ loc: ["body", "name"], msg: "field required", type: "missing" }] },
        422
      )
    )
    try {
      await backendCreateProperty("token", createPayload)
      throw new Error("expected backendCreateProperty to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("field required")
    }
  })

  it("falls back to the generic message when detail is null", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: null }, 500))
    try {
      await backendCreateProperty("token", createPayload)
      throw new Error("expected backendCreateProperty to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("stringifies a numeric detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: 42 }, 500))
    try {
      await backendCreateProperty("token", createPayload)
      throw new Error("expected backendCreateProperty to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("42")
    }
  })

  it("JSON-stringifies a plain object detail with no msg field", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { code: "E_CONFLICT" } }, 409))
    try {
      await backendCreateProperty("token", createPayload)
      throw new Error("expected backendCreateProperty to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(JSON.stringify({ code: "E_CONFLICT" }))
    }
  })

  it("joins the 422 validation error array by msg on the multipart upload path", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        { detail: [{ loc: ["body", "file"], msg: "file required", type: "missing" }] },
        422
      )
    )
    const mockFile = new File(["img content"], "photo.jpg", { type: "image/jpeg" })
    try {
      await backendUploadPropertyImage("token", "prop-uuid-1", mockFile)
      throw new Error("expected backendUploadPropertyImage to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("file required")
    }
  })
})

describe("propertiesBackend actions", () => {
  it("backendListProperties GETs /properties/ and unwraps items", async () => {
    mockFetch.mockReturnValue(mockResponse({ items: [], total: 0 }))
    const result = await backendListProperties("token")
    expect(result).toEqual([])
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/properties/"),
      expect.objectContaining({ method: "GET" })
    )
  })
})
