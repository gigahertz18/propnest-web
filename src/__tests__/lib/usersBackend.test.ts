/**
 * Tests for lib/api/usersBackend.ts
 *
 * Covers the server-side calls to FastAPI user endpoints, including the
 * detail-extraction logic used when the backend returns a non-2xx response.
 * `detail` is an untrusted external value — it can be any JSON type, so these
 * cases are enumerated from the JSON type space itself rather than from any
 * one backend's observed shape.
 */

import { backendListUsers, backendCreateUser } from "@/lib/api/usersBackend"
import type { ApiError } from "@/types"
import type { UserCreatePayload } from "@/types"

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

const createPayload: UserCreatePayload = {
  full_name: "Jane Smith",
  username: "janesmith",
  email: "jane@example.com",
  role: "user",
  is_active: true,
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe("usersBackend detail extraction", () => {
  it("uses a plain string detail as-is", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Username already exists" }, 409))
    try {
      await backendCreateUser("token", createPayload)
      throw new Error("expected backendCreateUser to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("Username already exists")
    }
  })

  it("joins FastAPI's structured 422 validation error array by msg", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        { detail: [{ loc: ["body", "email"], msg: "invalid email", type: "value_error" }] },
        422
      )
    )
    try {
      await backendCreateUser("token", createPayload)
      throw new Error("expected backendCreateUser to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("invalid email")
    }
  })

  it("falls back to the generic message when detail is null", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: null }, 500))
    try {
      await backendCreateUser("token", createPayload)
      throw new Error("expected backendCreateUser to reject")
    } catch (err) {
      expect((err as ApiError).detail).toContain("500")
    }
  })

  it("stringifies a numeric detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: 42 }, 500))
    try {
      await backendCreateUser("token", createPayload)
      throw new Error("expected backendCreateUser to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("42")
    }
  })

  it("JSON-stringifies a plain object detail with no msg field", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { code: "E_CONFLICT" } }, 409))
    try {
      await backendCreateUser("token", createPayload)
      throw new Error("expected backendCreateUser to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(JSON.stringify({ code: "E_CONFLICT" }))
    }
  })
})

describe("usersBackend actions", () => {
  it("backendListUsers GETs /users/", async () => {
    mockFetch.mockReturnValue(mockResponse([]))
    const result = await backendListUsers("token")
    expect(result).toEqual([])
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/users/"),
      expect.objectContaining({ method: "GET" })
    )
  })
})
