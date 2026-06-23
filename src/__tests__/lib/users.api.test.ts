import { usersApi } from "@/lib/api/users"
import { ApiError } from "@/types"

// ─── Mock fetch globally ──────────────────────────────────────────────────────

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

beforeEach(() => {
  mockFetch.mockReset()
})

// ─── list ─────────────────────────────────────────────────────────────────────

describe("usersApi.list", () => {
  it("calls GET /api/users", async () => {
    mockFetch.mockReturnValue(mockResponse([]))
    await usersApi.list()
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({ headers: expect.any(Object) })
    )
  })

  it("returns an array of users", async () => {
    const users = [{ id: "1", username: "admin" }]
    mockFetch.mockReturnValue(mockResponse(users))
    const result = await usersApi.list()
    expect(result).toEqual(users)
  })

  it("returns empty array when no users exist", async () => {
    mockFetch.mockReturnValue(mockResponse([]))
    const result = await usersApi.list()
    expect(result).toEqual([])
  })

  it("throws ApiError on 401", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    await expect(usersApi.list()).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 403", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Forbidden" }, 403))
    await expect(usersApi.list()).rejects.toThrow(ApiError)
  })

  it("throws ApiError with correct status and detail", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    try {
      await usersApi.list()
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(401)
      expect((err as ApiError).detail).toBe("Not authenticated")
    }
  })

  it("throws ApiError on 500 with fallback message when no detail", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}), // no detail field
      } as Response)
    )
    try {
      await usersApi.list()
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
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
    await expect(usersApi.list()).rejects.toThrow(ApiError)
  })
})

// ─── create ───────────────────────────────────────────────────────────────────

describe("usersApi.create", () => {
  const payload = {
    full_name: "Jane Smith",
    username: "janesmith",
    email: "jane@example.com",
    password: "password123",
    role: "user" as const,
    is_active: true,
  }

  it("calls POST /api/users with correct body", async () => {
    mockFetch.mockReturnValue(mockResponse({ id: "1", ...payload }))
    await usersApi.create(payload)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    )
  })

  it("returns the created user", async () => {
    const created = { id: "new-id", ...payload }
    mockFetch.mockReturnValue(mockResponse(created, 201))
    const result = await usersApi.create(payload)
    expect(result).toEqual(created)
  })

  it("throws ApiError on 409 conflict (duplicate username)", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Username already exists" }, 409))
    await expect(usersApi.create(payload)).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 422 validation error", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Invalid email" }, 422))
    try {
      await usersApi.create(payload)
    } catch (err) {
      expect((err as ApiError).status).toBe(422)
    }
  })
})

// ─── update ───────────────────────────────────────────────────────────────────

describe("usersApi.update", () => {
  it("calls PATCH /api/users/:id", async () => {
    mockFetch.mockReturnValue(mockResponse({ id: "abc" }))
    await usersApi.update("abc", { full_name: "Updated" })
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/users/abc",
      expect.objectContaining({ method: "PATCH" })
    )
  })

  it("sends only the provided fields", async () => {
    mockFetch.mockReturnValue(mockResponse({ id: "abc" }))
    await usersApi.update("abc", { role: "admin" })
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/users/abc",
      expect.objectContaining({
        body: JSON.stringify({ role: "admin" }),
      })
    )
  })

  it("throws ApiError on 404 when user not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "User not found" }, 404))
    await expect(usersApi.update("nonexistent", {})).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 403 when trying to update another admin", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Forbidden" }, 403))
    await expect(usersApi.update("other-admin", { role: "user" })).rejects.toThrow(ApiError)
  })
})

// ─── delete ───────────────────────────────────────────────────────────────────

describe("usersApi.delete", () => {
  it("calls DELETE /api/users/:id", async () => {
    mockFetch.mockReturnValue(mockEmptyResponse(204))
    await usersApi.delete("abc")
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/users/abc",
      expect.objectContaining({ method: "DELETE" })
    )
  })

  it("resolves without error on 204", async () => {
    mockFetch.mockReturnValue(mockEmptyResponse(204))
    await expect(usersApi.delete("abc")).resolves.toBeUndefined()
  })

  it("throws ApiError on 404 when user not found", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "User not found" }, 404))
    await expect(usersApi.delete("nonexistent")).rejects.toThrow(ApiError)
  })

  it("throws ApiError on 400 when deleting own account", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Cannot delete your own account" }, 400))
    await expect(usersApi.delete("self-id")).rejects.toThrow(ApiError)
  })
})
