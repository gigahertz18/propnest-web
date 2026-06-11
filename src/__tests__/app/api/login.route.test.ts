/**
 * @jest-environment node
 */

/**
 * Tests for POST /api/auth/login route handler.
 *
 * We mock the backend client and session helpers directly —
 * we're testing the Route Handler's logic, not the backend.
 */

import { POST } from "@/app/api/auth/login/route"
import { NextRequest } from "next/server"
import * as backendModule from "@/lib/api/backend"
import { ApiError } from "@/types"

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/api/backend", () => ({
  backendLogin: jest.fn(),
  backendGetMe: jest.fn(),
}))

// next/headers cookies mock
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}))

const mockBackendLogin = backendModule.backendLogin as jest.MockedFunction<
  typeof backendModule.backendLogin
>
const mockBackendGetMe = backendModule.backendGetMe as jest.MockedFunction<
  typeof backendModule.backendGetMe
>

const mockUser = {
  id: "user-1",
  username: "admin",
  email: "admin@propnest.com",
  full_name: "Admin User",
  role: "admin" as const,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── Happy path ───────────────────────────────────────────────────────────────

describe("POST /api/auth/login — happy path", () => {
  it("returns 200 with user data on successful login", async () => {
    mockBackendLogin.mockResolvedValue({ access_token: "tok", token_type: "bearer" })
    mockBackendGetMe.mockResolvedValue(mockUser)

    const res = await POST(makeRequest({ identifier: "admin", password: "pass" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual(mockUser)
  })

  it("calls backendLogin with trimmed identifier", async () => {
    mockBackendLogin.mockResolvedValue({ access_token: "tok", token_type: "bearer" })
    mockBackendGetMe.mockResolvedValue(mockUser)

    await POST(makeRequest({ identifier: "  admin  ", password: "pass" }))

    expect(mockBackendLogin).toHaveBeenCalledWith(expect.objectContaining({ identifier: "admin" }))
  })

  it("calls backendGetMe with the token from backendLogin", async () => {
    mockBackendLogin.mockResolvedValue({ access_token: "mytoken123", token_type: "bearer" })
    mockBackendGetMe.mockResolvedValue(mockUser)

    await POST(makeRequest({ identifier: "admin", password: "pass" }))

    expect(mockBackendGetMe).toHaveBeenCalledWith("mytoken123")
  })

  it("sets auth cookie in response", async () => {
    mockBackendLogin.mockResolvedValue({ access_token: "tok", token_type: "bearer" })
    mockBackendGetMe.mockResolvedValue(mockUser)

    const res = await POST(makeRequest({ identifier: "admin", password: "pass" }))
    const cookieHeader = res.headers.get("set-cookie")

    expect(cookieHeader).toContain("pn_token=tok")
  })

  it("sets httpOnly cookie", async () => {
    mockBackendLogin.mockResolvedValue({ access_token: "tok", token_type: "bearer" })
    mockBackendGetMe.mockResolvedValue(mockUser)

    const res = await POST(makeRequest({ identifier: "admin", password: "pass" }))
    const cookieHeader = res.headers.get("set-cookie") ?? ""

    expect(cookieHeader.toLowerCase()).toContain("httponly")
  })
})

// ─── Validation ───────────────────────────────────────────────────────────────

describe("POST /api/auth/login — validation", () => {
  it("returns 400 when identifier is missing", async () => {
    const res = await POST(makeRequest({ password: "pass" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 when password is missing", async () => {
    const res = await POST(makeRequest({ identifier: "admin" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 when identifier is whitespace only", async () => {
    const res = await POST(makeRequest({ identifier: "   ", password: "pass" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 when body is empty object", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("returns 400 when body is invalid JSON", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: "not json {{{",
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

// ─── Backend errors ───────────────────────────────────────────────────────────

describe("POST /api/auth/login — backend errors", () => {
  it("returns 401 when backend returns 401", async () => {
    mockBackendLogin.mockRejectedValue(new ApiError(401, "Invalid credentials"))

    const res = await POST(makeRequest({ identifier: "admin", password: "wrong" }))
    expect(res.status).toBe(401)
  })

  it("returns the backend detail message in response body", async () => {
    mockBackendLogin.mockRejectedValue(new ApiError(401, "Invalid credentials"))

    const res = await POST(makeRequest({ identifier: "admin", password: "wrong" }))
    const body = await res.json()
    expect(body.detail).toBe("Invalid credentials")
  })

  it("returns 500 on unexpected backend error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})

    mockBackendLogin.mockRejectedValue(new Error("Connection refused"))

    const res = await POST(makeRequest({ identifier: "admin", password: "pass" }))
    expect(res.status).toBe(500)
    expect(errorSpy).toHaveBeenCalledWith("[auth/login] Unexpected error:", expect.any(Error))

    errorSpy.mockRestore()
  })

  it("returns 500 when backendGetMe fails after successful login", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})

    mockBackendLogin.mockResolvedValue({ access_token: "tok", token_type: "bearer" })
    mockBackendGetMe.mockRejectedValue(new Error("Profile fetch failed"))

    const res = await POST(makeRequest({ identifier: "admin", password: "pass" }))
    expect(res.status).toBe(500)
    expect(errorSpy).toHaveBeenCalledWith("[auth/login] Unexpected error:", expect.any(Error))

    errorSpy.mockRestore()
  })

  it("returns 403 when backend returns 403", async () => {
    mockBackendLogin.mockRejectedValue(new ApiError(403, "Account inactive"))

    const res = await POST(makeRequest({ identifier: "admin", password: "pass" }))
    expect(res.status).toBe(403)
  })
})
