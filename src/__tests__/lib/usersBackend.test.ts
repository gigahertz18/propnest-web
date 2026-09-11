/**
 * Tests for lib/api/usersBackend.ts
 *
 * Covers the server-side calls to FastAPI user endpoints. Detail/fieldErrors
 * extraction and timeout behavior are shared by every *Backend.ts module and
 * are covered once in shared/backendFetch.test.ts rather than duplicated here.
 */

import { backendListUsers, backendCreateUser } from "@/lib/api/usersBackend"
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

  it("backendCreateUser POSTs the payload to /users/", async () => {
    mockFetch.mockReturnValue(mockResponse({ id: "user-uuid-1", ...createPayload }, 201))
    const result = await backendCreateUser("token", createPayload)
    expect(result).toEqual({ id: "user-uuid-1", ...createPayload })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/users/"),
      expect.objectContaining({ method: "POST", body: JSON.stringify(createPayload) })
    )
  })
})
