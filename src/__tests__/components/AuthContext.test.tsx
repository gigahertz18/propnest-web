/**
 * Tests for AuthContext — login, logout, role helpers, initial user hydration.
 */

import { act } from "@testing-library/react"
import { renderHook } from "@testing-library/react"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import type { CurrentUser } from "@/types"
import { ApiError } from "@/types"

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

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

function makeWrapper(initialUser: CurrentUser | null = null) {
  return function wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
  }
}

beforeEach(() => {
  mockFetch.mockReset()
  mockPush.mockReset()
  mockRefresh.mockReset()
})

// ─── Initial hydration from the server-provided user ──────────────────────────

describe("AuthContext — initial user hydration", () => {
  it("is not in a loading state, since the user is already known from the server", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(mockUser) })
    expect(result.current.loading).toBe(false)
  })

  it("uses the initialUser prop as the starting user", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(mockUser) })
    expect(result.current.user).toEqual(mockUser)
  })

  it("starts with a null user when no initialUser is provided", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(null) })
    expect(result.current.user).toBeNull()
  })

  it("does not fetch /api/auth/me on mount", () => {
    renderHook(() => useAuth(), { wrapper: makeWrapper(mockUser) })
    expect(mockFetch).not.toHaveBeenCalledWith("/api/auth/me")
  })
})

// ─── login ────────────────────────────────────────────────────────────────────

describe("AuthContext — login", () => {
  it("calls POST /api/auth/login with credentials", async () => {
    mockFetch.mockReturnValueOnce(mockResponse(mockUser))
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(null) })

    await act(async () => {
      await result.current.login({ identifier: "admin", password: "pass" })
    })

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("sets user after successful login", async () => {
    mockFetch.mockReturnValueOnce(mockResponse(mockUser))
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(null) })

    await act(async () => {
      await result.current.login({ identifier: "admin", password: "pass" })
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it("redirects to /dashboard after login without a follow-up refresh", async () => {
    mockFetch.mockReturnValueOnce(mockResponse(mockUser))
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(null) })

    await act(async () => {
      await result.current.login({ identifier: "admin", password: "pass" })
    })

    expect(mockPush).toHaveBeenCalledWith("/dashboard")
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it("throws ApiError on failed login", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ detail: "Invalid credentials" }, 401))
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(null) })

    await expect(
      act(async () => {
        await result.current.login({ identifier: "admin", password: "wrong" })
      })
    ).rejects.toThrow(ApiError)
  })

  it("does not set user on failed login", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ detail: "Invalid credentials" }, 401))
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(null) })

    try {
      await act(async () => {
        await result.current.login({ identifier: "admin", password: "wrong" })
      })
    } catch {
      /* expected */
    }

    expect(result.current.user).toBeNull()
  })
})

// ─── logout ───────────────────────────────────────────────────────────────────

describe("AuthContext — logout", () => {
  it("clears user on logout", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ ok: true }))

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(mockUser) })
    expect(result.current.user).toEqual(mockUser)

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
  })

  it("redirects to /login after logout", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ ok: true }))

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(mockUser) })

    await act(async () => {
      await result.current.logout()
    })

    expect(mockPush).toHaveBeenCalledWith("/login")
  })

  it("calls POST /api/auth/logout", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ ok: true }))

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(mockUser) })

    await act(async () => {
      await result.current.logout()
    })

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({ method: "POST" })
    )
  })
})

// ─── Role helpers ─────────────────────────────────────────────────────────────

describe("AuthContext — role helpers", () => {
  function setupWithRole(role: "admin" | "manager" | "user") {
    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper({ ...mockUser, role }),
    })
    return result
  }

  it("isAdmin is true for admin role", () => {
    const result = setupWithRole("admin")
    expect(result.current.isAdmin).toBe(true)
  })

  it("isAdmin is false for manager role", () => {
    const result = setupWithRole("manager")
    expect(result.current.isAdmin).toBe(false)
  })

  it("isManager is true for manager role", () => {
    const result = setupWithRole("manager")
    expect(result.current.isManager).toBe(true)
  })

  it("isManager is false for admin role", () => {
    const result = setupWithRole("admin")
    expect(result.current.isManager).toBe(false)
  })

  it("isAtLeastManager is true for admin", () => {
    const result = setupWithRole("admin")
    expect(result.current.isAtLeastManager).toBe(true)
  })

  it("isAtLeastManager is true for manager", () => {
    const result = setupWithRole("manager")
    expect(result.current.isAtLeastManager).toBe(true)
  })

  it("isAtLeastManager is false for user", () => {
    const result = setupWithRole("user")
    expect(result.current.isAtLeastManager).toBe(false)
  })

  it("isRegularUser is true for user role", () => {
    const result = setupWithRole("user")
    expect(result.current.isRegularUser).toBe(true)
  })

  it("all role helpers are false when no user is logged in", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(null) })

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isManager).toBe(false)
    expect(result.current.isAtLeastManager).toBe(false)
    expect(result.current.isRegularUser).toBe(false)
  })
})

// ─── useAuth guard ────────────────────────────────────────────────────────────

describe("useAuth — outside provider", () => {
  it("throws when used outside AuthProvider", () => {
    // Suppress expected console.error from React
    const spy = jest.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used inside <AuthProvider>")
    spy.mockRestore()
  })
})
