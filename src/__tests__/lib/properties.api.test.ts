/**
 * Tests for lib/api/properties.ts
 *
 * Covers the client-side propertiesApi that calls Next.js Route Handlers.
 * All fetch calls are mocked — we're testing the client logic, not the network.
 */

import { propertiesApi } from "@/lib/api/properties"
import { ApiError } from "@/types"
import type { Property, PropertyCreatePayload } from "@/types/property"

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

const mockProperty: Property = {
  id: "prop-uuid-1",
  name: "Sunset Villa",
  address: "123 Main St, Laguna",
  description: "A lovely villa",
  status: "vacant",
  is_active: true,
  manager_id: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
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

// ─── list ─────────────────────────────────────────────────────────────────────

describe("propertiesApi.list", () => {
  it("calls GET /api/properties", async () => {
    mockFetch.mockReturnValue(mockResponse([]))
    await propertiesApi.list()
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/properties",
      expect.objectContaining({ headers: expect.any(Object) })
    )
  })

  it("returns an array of properties", async () => {
    mockFetch.mockReturnValue(mockResponse([mockProperty]))
    const result = await propertiesApi.list()
    expect(result).toEqual([mockProperty])
  })

  it("returns empty array when no properties exist", async () => {
    mockFetch.mockReturnValue(mockResponse([]))
    const result = await propertiesApi.list()
    expect(result).toEqual([])
  })

  it("throws ApiError on 401", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(propertiesApi.list()).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 403", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Forbidden" }, 403))
    await expect(propertiesApi.list()).rejects.toThrow(ApiError)
  })

  it("throws ApiError with correct status and detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    try {
      await propertiesApi.list()
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
      await propertiesApi.list()
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("throws ApiError when response body is not JSON", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.reject(new Error("not json")),
      } as Response)
    )
    await expect(propertiesApi.list()).rejects.toThrow(ApiError)
  })
})

// ─── create ───────────────────────────────────────────────────────────────────

describe("propertiesApi.create", () => {
  it("calls POST /api/properties with correct body", async () => {
    mockFetch.mockReturnValue(mockResponse(mockProperty, 201))
    await propertiesApi.create(createPayload)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/properties",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(createPayload),
      })
    )
  })

  it("returns the created property", async () => {
    mockFetch.mockReturnValue(mockResponse(mockProperty, 201))
    const result = await propertiesApi.create(createPayload)
    expect(result).toEqual(mockProperty)
  })

  it("throws ApiError on 401 when unauthenticated", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(propertiesApi.create(createPayload)).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 403 when non-admin tries to create", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Forbidden" }, 403))
    await expect(propertiesApi.create(createPayload)).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 422 validation error", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "name field required" }, 422))
    try {
      await propertiesApi.create({ ...createPayload, name: "" })
    } catch (err) {
      expect((err as ApiError).status).toBe(422)
    }
  })

  it("throws ApiError on 409 duplicate property name", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Property already exists" }, 409))
    await expect(propertiesApi.create(createPayload)).rejects.toThrow(ApiError)
  })
})

// ─── update ───────────────────────────────────────────────────────────────────

describe("propertiesApi.update", () => {
  it("calls PATCH /api/properties/:id", async () => {
    mockFetch.mockReturnValue(mockResponse(mockProperty))
    await propertiesApi.update("prop-uuid-1", { name: "New Name" })
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/properties/prop-uuid-1",
      expect.objectContaining({ method: "PATCH" })
    )
  })

  it("sends only the provided fields", async () => {
    mockFetch.mockReturnValue(mockResponse(mockProperty))
    await propertiesApi.update("prop-uuid-1", { status: "occupied" })
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/properties/prop-uuid-1",
      expect.objectContaining({ body: JSON.stringify({ status: "occupied" }) })
    )
  })

  it("sends is_active when toggling active state", async () => {
    mockFetch.mockReturnValue(mockResponse({ ...mockProperty, is_active: false }))
    await propertiesApi.update("prop-uuid-1", { is_active: false })
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/properties/prop-uuid-1",
      expect.objectContaining({ body: JSON.stringify({ is_active: false }) })
    )
  })

  it("returns the updated property", async () => {
    const updated = { ...mockProperty, name: "Renamed Villa" }
    mockFetch.mockReturnValue(mockResponse(updated))
    const result = await propertiesApi.update("prop-uuid-1", { name: "Renamed Villa" })
    expect(result).toEqual(updated)
  })

  it("throws ApiError on 404 when property not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Property not found" }, 404))
    await expect(propertiesApi.update("nonexistent", { name: "X" })).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 403 when non-admin tries to update", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Forbidden" }, 403))
    await expect(propertiesApi.update("prop-uuid-1", { name: "X" })).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 401 when unauthenticated", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(propertiesApi.update("prop-uuid-1", {})).rejects.toThrow(ApiError)
  })
})

// ─── delete ───────────────────────────────────────────────────────────────────

describe("propertiesApi.delete", () => {
  it("calls DELETE /api/properties/:id", async () => {
    mockFetch.mockReturnValue(mockEmptyResponse(204))
    await propertiesApi.delete("prop-uuid-1")
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/properties/prop-uuid-1",
      expect.objectContaining({ method: "DELETE" })
    )
  })

  it("resolves without error on 204", async () => {
    mockFetch.mockReturnValue(mockEmptyResponse(204))
    await expect(propertiesApi.delete("prop-uuid-1")).resolves.toBeUndefined()
  })

  it("throws ApiError on 404 when property not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Property not found" }, 404))
    await expect(propertiesApi.delete("nonexistent")).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 403 when non-admin tries to delete", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Forbidden" }, 403))
    await expect(propertiesApi.delete("prop-uuid-1")).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 401 when unauthenticated", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(propertiesApi.delete("prop-uuid-1")).rejects.toThrow(ApiError)
  })
})

// ─── uploadImage ──────────────────────────────────────────────────────────────

describe("propertiesApi.uploadImage", () => {
  const mockFile = new File(["img content"], "photo.jpg", { type: "image/jpeg" })
  const mockImageResult = {
    id: "doc-1",
    file_url: "https://minio/photo.jpg",
    filename: "photo.jpg",
  }

  it("calls POST /api/properties/:id/images", async () => {
    mockFetch.mockReturnValue(mockResponse(mockImageResult, 201))
    await propertiesApi.uploadImage("prop-uuid-1", mockFile)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/properties/prop-uuid-1/images",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("sends a FormData body (not JSON)", async () => {
    mockFetch.mockReturnValue(mockResponse(mockImageResult, 201))
    await propertiesApi.uploadImage("prop-uuid-1", mockFile)
    const call = mockFetch.mock.calls[0][1]
    expect(call.body).toBeInstanceOf(FormData)
  })

  it("returns the created document with file_url", async () => {
    mockFetch.mockReturnValue(mockResponse(mockImageResult, 201))
    const result = await propertiesApi.uploadImage("prop-uuid-1", mockFile)
    expect(result).toEqual(mockImageResult)
  })

  it("throws ApiError on 401 when unauthenticated", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(propertiesApi.uploadImage("prop-uuid-1", mockFile)).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 403 when non-admin tries to upload", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Forbidden" }, 403))
    await expect(propertiesApi.uploadImage("prop-uuid-1", mockFile)).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 413 when file is too large", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "File too large" }, 413))
    await expect(propertiesApi.uploadImage("prop-uuid-1", mockFile)).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 503 when MinIO is unavailable", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Failed to store document" }, 503))
    await expect(propertiesApi.uploadImage("prop-uuid-1", mockFile)).rejects.toThrow(ApiError)
  })
})

// ─── listImages ───────────────────────────────────────────────────────────────

describe("propertiesApi.listImages", () => {
  const mockImages = [
    { id: "doc-1", file_url: "https://minio/a.jpg", filename: "a.jpg" },
    { id: "doc-2", file_url: "https://minio/b.jpg", filename: "b.jpg" },
  ]

  it("calls GET /api/properties/:id/images", async () => {
    mockFetch.mockReturnValue(mockResponse(mockImages))
    await propertiesApi.listImages("prop-uuid-1")
    expect(mockFetch).toHaveBeenCalledWith("/api/properties/prop-uuid-1/images", expect.any(Object))
  })

  it("returns array of images", async () => {
    mockFetch.mockReturnValue(mockResponse(mockImages))
    const result = await propertiesApi.listImages("prop-uuid-1")
    expect(result).toEqual(mockImages)
  })

  it("returns empty array when property has no images", async () => {
    mockFetch.mockReturnValue(mockResponse([]))
    const result = await propertiesApi.listImages("prop-uuid-1")
    expect(result).toEqual([])
  })

  it("throws ApiError on 404 when property not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Property not found" }, 404))
    await expect(propertiesApi.listImages("nonexistent")).rejects.toThrow(ApiError)
  })
})

// ─── deleteImage ──────────────────────────────────────────────────────────────

describe("propertiesApi.deleteImage", () => {
  it("calls DELETE /api/properties/:id/images/:documentId", async () => {
    mockFetch.mockReturnValue(mockEmptyResponse(204))
    await propertiesApi.deleteImage("prop-uuid-1", "doc-1")
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/properties/prop-uuid-1/images/doc-1",
      expect.objectContaining({ method: "DELETE" })
    )
  })

  it("resolves without error on 204", async () => {
    mockFetch.mockReturnValue(mockEmptyResponse(204))
    await expect(propertiesApi.deleteImage("prop-uuid-1", "doc-1")).resolves.toBeUndefined()
  })

  it("throws ApiError on 404 when document not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Document not found" }, 404))
    await expect(propertiesApi.deleteImage("prop-uuid-1", "nonexistent")).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 403 when non-admin tries to delete", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Forbidden" }, 403))
    await expect(propertiesApi.deleteImage("prop-uuid-1", "doc-1")).rejects.toThrow(ApiError)
  })
})
