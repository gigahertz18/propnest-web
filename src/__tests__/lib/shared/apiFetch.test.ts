/**
 * Tests for lib/api/shared/apiFetch.ts
 *
 * Covers the single client-side fetch/error-normalization implementation
 * shared by every `*Api` module. `detail` is an untrusted external value —
 * it can be any JSON type — so these cases are enumerated from the JSON
 * type space itself rather than from any one route's observed shape.
 */

import { apiFetch, apiFetchMultipart, apiFetchRaw } from "@/lib/api/shared/apiFetch"
import { ApiError } from "@/types"

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    headers: new Headers(headers),
  } as Response)
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe("apiFetch", () => {
  it("calls the given path with a JSON Content-Type header", async () => {
    mockFetch.mockReturnValue(mockResponse({ ok: true }))
    await apiFetch("/api/contracts")
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/contracts",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    )
  })

  it("returns parsed JSON on success", async () => {
    mockFetch.mockReturnValue(mockResponse({ id: "1" }))
    const result = await apiFetch("/api/contracts/1")
    expect(result).toEqual({ id: "1" })
  })

  it("returns undefined on 204", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error("no body")),
      } as Response)
    )
    const result = await apiFetch("/api/contracts/1", { method: "DELETE" })
    expect(result).toBeUndefined()
  })

  it("throws ApiError with a plain string detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(apiFetch("/api/contracts")).rejects.toThrow(ApiError)
  })

  it("falls back to a status message when the response body isn't JSON", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("not json")),
      } as Response)
    )
    try {
      await apiFetch("/api/contracts")
      throw new Error("expected apiFetch to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("extracts a readable message from a FastAPI-shaped 422 array", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        {
          detail: [
            { loc: ["body", "amount"], msg: "must be greater than 0", type: "greater_than" },
          ],
        },
        422
      )
    )
    try {
      await apiFetch("/api/payments")
      throw new Error("expected apiFetch to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("must be greater than 0")
    }
  })

  it("passes the response body's fieldErrors through onto the thrown ApiError, for every module", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        { detail: "must be 13 digits", fieldErrors: { reference_number: "must be 13 digits" } },
        422
      )
    )
    try {
      await apiFetch("/api/contracts")
      throw new Error("expected apiFetch to reject")
    } catch (err) {
      expect((err as ApiError).fieldErrors).toEqual({ reference_number: "must be 13 digits" })
    }
  })

  it("leaves fieldErrors undefined when the response body doesn't have any", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    try {
      await apiFetch("/api/contracts")
      throw new Error("expected apiFetch to reject")
    } catch (err) {
      expect((err as ApiError).fieldErrors).toBeUndefined()
    }
  })
})

describe("apiFetchMultipart", () => {
  it("does not set a Content-Type header", async () => {
    mockFetch.mockReturnValue(mockResponse({ id: "doc-1" }))
    await apiFetchMultipart("/api/properties/1/images", { method: "POST", body: new FormData() })
    const [, options] = mockFetch.mock.calls[0]
    expect(
      (options.headers as Record<string, string> | undefined)?.["Content-Type"]
    ).toBeUndefined()
  })

  it("throws ApiError on a non-OK response", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "File too large" }, 413))
    await expect(
      apiFetchMultipart("/api/properties/1/images", { method: "POST", body: new FormData() })
    ).rejects.toThrow(ApiError)
  })
})

describe("apiFetchRaw", () => {
  it("returns the raw Response on success without parsing JSON", async () => {
    mockFetch.mockReturnValue(mockResponse({}, 200, { "content-type": "application/pdf" }))
    const res = await apiFetchRaw("/api/receipts/1/download")
    expect(res.headers.get("content-type")).toBe("application/pdf")
  })

  it("throws ApiError on a non-OK response", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Receipt not found" }, 404))
    await expect(apiFetchRaw("/api/receipts/1/download")).rejects.toThrow(ApiError)
  })
})
