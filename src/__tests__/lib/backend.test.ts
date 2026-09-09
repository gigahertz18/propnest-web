/**
 * Tests for lib/api/backend.ts
 *
 * Covers the server-side calls to FastAPI auth endpoints, including the
 * detail-extraction logic used when the backend returns a non-2xx response.
 * `detail` is an untrusted external value — it can be any JSON type, so these
 * cases are enumerated from the JSON type space itself rather than from any
 * one backend's observed shape.
 */

import { backendLogin, backendGetMe } from "@/lib/api/backend"
import type { ApiError } from "@/types"
import type { LoginPayload } from "@/types"

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

const loginPayload: LoginPayload = {
  identifier: "admin",
  password: "wrong-password",
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe("backend detail extraction", () => {
  it("uses a plain string detail as-is", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Incorrect username or password" }, 401))
    try {
      await backendLogin(loginPayload)
      throw new Error("expected backendLogin to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("Incorrect username or password")
    }
  })

  it("joins FastAPI's structured 422 validation error array by msg", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        { detail: [{ loc: ["body", "identifier"], msg: "field required", type: "missing" }] },
        422
      )
    )
    try {
      await backendLogin(loginPayload)
      throw new Error("expected backendLogin to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("field required")
    }
  })

  it("falls back to the generic message when detail is null", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: null }, 500))
    try {
      await backendLogin(loginPayload)
      throw new Error("expected backendLogin to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("stringifies a numeric detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: 42 }, 500))
    try {
      await backendLogin(loginPayload)
      throw new Error("expected backendLogin to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("42")
    }
  })

  it("JSON-stringifies a plain object detail with no msg field", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { code: "E_LOCKED" } }, 403))
    try {
      await backendLogin(loginPayload)
      throw new Error("expected backendLogin to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(JSON.stringify({ code: "E_LOCKED" }))
    }
  })
})

describe("backend actions", () => {
  it("backendLogin POSTs to /auth/login", async () => {
    mockFetch.mockReturnValue(mockResponse({ access_token: "tok", token_type: "bearer" }))
    const result = await backendLogin(loginPayload)
    expect(result).toEqual({ access_token: "tok", token_type: "bearer" })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/login"),
      expect.objectContaining({ method: "POST", body: JSON.stringify(loginPayload) })
    )
  })

  it("backendGetMe GETs /auth/me with the bearer token", async () => {
    mockFetch.mockReturnValue(
      mockResponse({
        id: "1",
        username: "admin",
        email: "admin@example.com",
        full_name: "Admin",
        role: "admin",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      })
    )
    await backendGetMe("my-token")
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/me"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer my-token" }),
      })
    )
  })
})
