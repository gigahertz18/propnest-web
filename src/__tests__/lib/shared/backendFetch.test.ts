/**
 * Tests for lib/api/shared/backendFetch.ts
 *
 * Covers the single server-side fetch/error-normalization implementation
 * shared by every *Backend.ts module. `detail` is an untrusted external
 * value — it can be any JSON type — so these cases are enumerated from the
 * JSON type space itself rather than from any one backend's observed shape.
 */

import {
  backendFetch,
  backendFetchMultipart,
  backendFetchRaw,
  backendFetchList,
} from "@/lib/api/shared/backendFetch"
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

describe("backendFetch", () => {
  it("calls the backend URL with the JSON prefix and Authorization header", async () => {
    mockFetch.mockReturnValue(mockResponse({ ok: true }))
    await backendFetch("/contracts/", { method: "GET", token: "tok" })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/contracts/"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer tok",
        }),
      })
    )
  })

  it("omits Authorization when no token is given", async () => {
    mockFetch.mockReturnValue(mockResponse({ access_token: "x" }))
    await backendFetch("/auth/login", { method: "POST" })
    const [, options] = mockFetch.mock.calls[0]
    expect((options.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it("returns parsed JSON on success", async () => {
    mockFetch.mockReturnValue(mockResponse({ id: "1" }))
    const result = await backendFetch("/contracts/1", { token: "tok" })
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
    const result = await backendFetch("/contracts/1", { method: "DELETE", token: "tok" })
    expect(result).toBeUndefined()
  })

  it("throws ApiError with a plain string detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(backendFetch("/contracts/", { token: "tok" })).rejects.toThrow(ApiError)
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
      await backendFetch("/contracts/", { token: "tok" })
      throw new Error("expected backendFetch to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("extracts a readable message from a FastAPI 422 validation array", async () => {
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
      await backendFetch("/payments/", { token: "tok" })
      throw new Error("expected backendFetch to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("must be greater than 0")
    }
  })

  it("populates fieldErrors from a FastAPI 422 validation array for every module, not just payments", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        {
          detail: [
            { loc: ["body", "rent_amount"], msg: "must be greater than 0", type: "greater_than" },
          ],
        },
        422
      )
    )
    try {
      await backendFetch("/contracts/", { token: "tok" })
      throw new Error("expected backendFetch to reject")
    } catch (err) {
      expect((err as ApiError).fieldErrors).toEqual({ rent_amount: "must be greater than 0" })
    }
  })

  it("leaves fieldErrors undefined when detail has no loc/msg entries", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    try {
      await backendFetch("/contracts/", { token: "tok" })
      throw new Error("expected backendFetch to reject")
    } catch (err) {
      expect((err as ApiError).fieldErrors).toBeUndefined()
    }
  })

  it("maps a fetch timeout abort into a 504 ApiError", async () => {
    mockFetch.mockImplementation(() =>
      Promise.reject(new DOMException("The operation was aborted", "AbortError"))
    )
    try {
      await backendFetch("/contracts/", { token: "tok" })
      throw new Error("expected backendFetch to reject")
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(504)
    }
  })

  it("sets an AbortSignal on every request when the caller doesn't supply one", async () => {
    mockFetch.mockReturnValue(mockResponse({}))
    await backendFetch("/contracts/", { token: "tok" })
    const [, options] = mockFetch.mock.calls[0]
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })

  it("doesn't override a caller-supplied signal", async () => {
    mockFetch.mockReturnValue(mockResponse({}))
    const controller = new AbortController()
    await backendFetch("/contracts/", { token: "tok", signal: controller.signal })
    const [, options] = mockFetch.mock.calls[0]
    expect(options.signal).toBe(controller.signal)
  })

  it("propagates a caller-supplied signal's own abort as-is, not as a 504", async () => {
    mockFetch.mockImplementation(() =>
      Promise.reject(new DOMException("The operation was aborted", "AbortError"))
    )
    const controller = new AbortController()
    await expect(
      backendFetch("/contracts/", { token: "tok", signal: controller.signal })
    ).rejects.toThrow(DOMException)
  })
})

describe("backendFetchMultipart", () => {
  it("does not set a Content-Type header", async () => {
    mockFetch.mockReturnValue(mockResponse({ id: "doc-1" }))
    await backendFetchMultipart("/documents/upload", {
      method: "POST",
      token: "tok",
      body: new FormData(),
    })
    const [, options] = mockFetch.mock.calls[0]
    expect((options.headers as Record<string, string>)["Content-Type"]).toBeUndefined()
    expect((options.headers as Record<string, string>).Authorization).toBe("Bearer tok")
  })

  it("throws ApiError on a non-OK response", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "File too large" }, 413))
    await expect(
      backendFetchMultipart("/documents/upload", {
        method: "POST",
        token: "tok",
        body: new FormData(),
      })
    ).rejects.toThrow(ApiError)
  })
})

describe("backendFetchRaw", () => {
  it("returns the raw Response on success without parsing JSON", async () => {
    mockFetch.mockReturnValue(mockResponse({}, 200, { "content-type": "application/pdf" }))
    const res = await backendFetchRaw("/receipts/1/download", { method: "GET", token: "tok" })
    expect(res.headers.get("content-type")).toBe("application/pdf")
  })

  it("throws ApiError on a non-OK response", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Receipt not found" }, 404))
    await expect(
      backendFetchRaw("/receipts/1/download", { method: "GET", token: "tok" })
    ).rejects.toThrow(ApiError)
  })
})

describe("backendFetchList", () => {
  it("unwraps a {items,total} paginated envelope into a bare array", async () => {
    mockFetch.mockReturnValue(mockResponse({ items: [{ id: "1" }, { id: "2" }], total: 2 }))
    const result = await backendFetchList("/contracts/", { method: "GET", token: "tok" })
    expect(result).toEqual([{ id: "1" }, { id: "2" }])
  })

  it("returns an empty array when the envelope has no items", async () => {
    mockFetch.mockReturnValue(mockResponse({ items: [], total: 0 }))
    const result = await backendFetchList("/contracts/", { method: "GET", token: "tok" })
    expect(result).toEqual([])
  })

  it("throws ApiError on a non-OK response", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(backendFetchList("/contracts/", { token: "tok" })).rejects.toThrow(ApiError)
  })
})
