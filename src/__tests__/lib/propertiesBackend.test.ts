/**
 * Tests for lib/api/propertiesBackend.ts
 *
 * Covers the server-side calls to FastAPI property endpoints. Detail/
 * fieldErrors extraction and timeout behavior are shared by every
 * *Backend.ts module and are covered once in shared/backendFetch.test.ts
 * rather than duplicated here — except one regression case confirming the
 * multipart upload path is also wired through the shared error handling.
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

  it("backendCreateProperty POSTs the payload to /properties/", async () => {
    mockFetch.mockReturnValue(mockResponse({ id: "prop-uuid-1", ...createPayload }, 201))
    const result = await backendCreateProperty("token", createPayload)
    expect(result).toEqual({ id: "prop-uuid-1", ...createPayload })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/properties/"),
      expect.objectContaining({ method: "POST", body: JSON.stringify(createPayload) })
    )
  })
})
