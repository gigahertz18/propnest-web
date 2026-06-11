/**
 * Tests for AuthContext — login, logout, role helpers, session rehydration.
 */

import { render, screen, act, waitFor } from "@testing-library/react"
import { renderHook } from "@testing-library/react"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { ApiError } from "@/types"

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush    = jest.fn()
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

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

beforeEach(() => {
  mockFetch.mockReset()
  mockPush.mockReset()
  mockRefresh.mockReset()
})

// ─── Session rehydration ──────────────────────────────────────────────────────

describe("AuthContext — session rehydration", () => {
  it("starts in loading state", async () => {
    mockFetch.mockReturnValue(mockResponse(null, 401))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it("sets user when /api/auth/me returns 200", async () => {
    mockFetch.mockReturnValue(mockResponse(mockUser))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toEqual(mockUser)
  })

  it("sets user to null when /api/auth/me returns 401", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
  })

  it("sets user to null when fetch throws", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
  })

  it("sets loading to false after rehydration completes", async () => {
    mockFetch.mockReturnValue(mockResponse(mockUser))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
  })
})

// ─── login ────────────────────────────────────────────────────────────────────

describe("AuthContext — login", () => {
  beforeEach(() => {
    // First call is rehydration (/api/auth/me) — return 401
    // Second call is login (/api/auth/login)
    mockFetch
      .mockReturnValueOnce(mockResponse({ detail: "Not authenticated" }, 401))
  })

  it("calls POST /api/auth/login with credentials", async () => {
    mockFetch.mockReturnValueOnce(mockResponse(mockUser))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

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
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.login({ identifier: "admin", password: "pass" })
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it("redirects to /dashboard after login", async () => {
    mockFetch.mockReturnValueOnce(mockResponse(mockUser))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.login({ identifier: "admin", password: "pass" })
    })

    expect(mockPush).toHaveBeenCalledWith("/dashboard")
  })

  it("throws ApiError on failed login", async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ detail: "Invalid credentials" }, 401)
    )
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      act(async () => {
        await result.current.login({ identifier: "admin", password: "wrong" })
      })
    ).rejects.toThrow(ApiError)
  })

  it("does not set user on failed login", async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ detail: "Invalid credentials" }, 401)
    )
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    try {
      await act(async () => {
        await result.current.login({ identifier: "admin", password: "wrong" })
      })
    } catch { /* expected */ }

    expect(result.current.user).toBeNull()
  })
})

// ─── logout ───────────────────────────────────────────────────────────────────

describe("AuthContext — logout", () => {
  it("clears user on logout", async () => {
    mockFetch
      .mockReturnValueOnce(mockResponse(mockUser))     // rehydrate
      .mockReturnValueOnce(mockResponse({ ok: true })) // logout

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.user).toEqual(mockUser))

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
  })

  it("redirects to /login after logout", async () => {
    mockFetch
      .mockReturnValueOnce(mockResponse(mockUser))
      .mockReturnValueOnce(mockResponse({ ok: true }))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.user).toEqual(mockUser))

    await act(async () => {
      await result.current.logout()
    })

    expect(mockPush).toHaveBeenCalledWith("/login")
  })

  it("calls POST /api/auth/logout", async () => {
    mockFetch
      .mockReturnValueOnce(mockResponse(mockUser))
      .mockReturnValueOnce(mockResponse({ ok: true }))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.user).toEqual(mockUser))

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
  async function setupWithRole(role: "admin" | "manager" | "user") {
    mockFetch.mockReturnValue(mockResponse({ ...mockUser, role }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    return result
  }

  it("isAdmin is true for admin role", async () => {
    const result = await setupWithRole("admin")
    expect(result.current.isAdmin).toBe(true)
  })

  it("isAdmin is false for manager role", async () => {
    const result = await setupWithRole("manager")
    expect(result.current.isAdmin).toBe(false)
  })

  it("isManager is true for manager role", async () => {
    const result = await setupWithRole("manager")
    expect(result.current.isManager).toBe(true)
  })

  it("isManager is false for admin role", async () => {
    const result = await setupWithRole("admin")
    expect(result.current.isManager).toBe(false)
  })

  it("isAtLeastManager is true for admin", async () => {
    const result = await setupWithRole("admin")
    expect(result.current.isAtLeastManager).toBe(true)
  })

  it("isAtLeastManager is true for manager", async () => {
    const result = await setupWithRole("manager")
    expect(result.current.isAtLeastManager).toBe(true)
  })

  it("isAtLeastManager is false for user", async () => {
    const result = await setupWithRole("user")
    expect(result.current.isAtLeastManager).toBe(false)
  })

  it("isRegularUser is true for user role", async () => {
    const result = await setupWithRole("user")
    expect(result.current.isRegularUser).toBe(true)
  })

  it("all role helpers are false when no user is logged in", async () => {
    mockFetch.mockReturnValue(mockResponse(null, 401))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

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
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used inside <AuthProvider>"
    )
    spy.mockRestore()
  })
})
