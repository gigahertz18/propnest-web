/**
 * Tests for lib/api/backend.ts
 *
 * Covers the server-side calls to FastAPI auth endpoints. Detail/fieldErrors
 * extraction and timeout behavior are shared by every *Backend.ts module and
 * are covered once in shared/backendFetch.test.ts rather than duplicated here.
 */

import { backendLogin, backendGetMe } from "@/lib/api/backend"
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
