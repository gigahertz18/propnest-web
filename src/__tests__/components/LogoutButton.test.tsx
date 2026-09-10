/**
 * Tests for components/layout/LogoutButton.tsx
 *
 * Covers: rendering, logout flow, and failure recovery.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import LogoutButton from "@/components/layout/LogoutButton"
import { useAuth } from "@/context/AuthContext"

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const mockLogout = jest.fn()

function setupAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  mockUseAuth.mockReturnValue({
    user: {
      id: "user-1",
      username: "tenant",
      email: "tenant@propnest.com",
      full_name: "PropNest Tenant",
      role: "user",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    loading: false,
    isAdmin: false,
    isManager: false,
    isAtLeastManager: false,
    isRegularUser: true,
    login: jest.fn(),
    logout: mockLogout,
    ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockLogout.mockResolvedValue(undefined)
})

// ─── Rendering ────────────────────────────────────────────────────────────────

describe("LogoutButton — rendering", () => {
  it("renders a Log out button", () => {
    setupAuth()
    render(<LogoutButton />)
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument()
  })
})

// ─── Logout ───────────────────────────────────────────────────────────────────

describe("LogoutButton — logout", () => {
  it("calls logout when Log out is clicked", async () => {
    setupAuth()
    render(<LogoutButton />)
    fireEvent.click(screen.getByRole("button", { name: /log out/i }))
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })
  })

  it("shows 'Logging out…' and disables the button while logout is in progress", async () => {
    let resolveLogout!: () => void
    mockLogout.mockReturnValue(
      new Promise<void>((res) => {
        resolveLogout = res
      })
    )
    setupAuth()
    render(<LogoutButton />)
    fireEvent.click(screen.getByRole("button", { name: /log out/i }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /logging out/i })).toBeDisabled()
    })
    resolveLogout()
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^log out$/i })).not.toBeDisabled()
    })
  })

  it("does not call logout more than once if clicked multiple times", async () => {
    let resolveLogout!: () => void
    mockLogout.mockReturnValue(
      new Promise<void>((res) => {
        resolveLogout = res
      })
    )
    setupAuth()
    render(<LogoutButton />)
    const btn = screen.getByRole("button", { name: /log out/i })
    fireEvent.click(btn)
    await waitFor(() => expect(btn).toBeDisabled())
    fireEvent.click(btn)
    expect(mockLogout).toHaveBeenCalledTimes(1)
    resolveLogout()
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^log out$/i })).not.toBeDisabled()
    })
  })

  it("re-enables the button and shows an error when logout fails", async () => {
    mockLogout.mockRejectedValue(new Error("network error"))
    setupAuth()
    render(<LogoutButton />)
    fireEvent.click(screen.getByRole("button", { name: /log out/i }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^log out$/i })).not.toBeDisabled()
    })
    expect(screen.getByText(/failed to log out/i)).toBeInTheDocument()
  })
})
