/**
 * Tests for components/layout/AdminNav.tsx
 *
 * Covers: rendering, logout flow, role badge display, logo link, and edge cases.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import AdminNav from "@/components/layout/AdminNav"
import { useAuth } from "@/context/AuthContext"

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}))

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const mockLogout = jest.fn()

function setupAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  mockUseAuth.mockReturnValue({
    user: {
      id: "user-1",
      username: "admin",
      email: "admin@propnest.com",
      full_name: "PropNest Admin",
      role: "admin",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    loading: false,
    isAdmin: true,
    isManager: false,
    isAtLeastManager: true,
    isRegularUser: false,
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

describe("AdminNav — rendering", () => {
  it("renders the propnest logo", () => {
    setupAuth()
    render(<AdminNav />)
    expect(screen.getByText("propnest")).toBeInTheDocument()
  })

  it("logo links to /dashboard", () => {
    setupAuth()
    render(<AdminNav />)
    expect(screen.getByText("propnest").closest("a")).toHaveAttribute("href", "/dashboard")
  })

  it("renders the user's full name", () => {
    setupAuth()
    render(<AdminNav />)
    expect(screen.getByText("PropNest Admin")).toBeInTheDocument()
  })

  it("renders the user's role badge", () => {
    setupAuth()
    render(<AdminNav />)
    expect(screen.getByText("admin")).toBeInTheDocument()
  })

  it("renders role badge as 'manager' for manager users", () => {
    setupAuth({
      user: {
        id: "u2",
        username: "mgr",
        email: "mgr@propnest.com",
        full_name: "A Manager",
        role: "manager",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    })
    render(<AdminNav />)
    expect(screen.getByText("manager")).toBeInTheDocument()
  })

  it("renders Log out button", () => {
    setupAuth()
    render(<AdminNav />)
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument()
  })

  it("renders nothing for user name when user is null", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      isAdmin: false,
      isManager: false,
      isAtLeastManager: false,
      isRegularUser: false,
      login: jest.fn(),
      logout: mockLogout,
    })
    render(<AdminNav />)
    // Nav still renders, just no user details
    expect(screen.getByText("propnest")).toBeInTheDocument()
    expect(screen.queryByText("PropNest Admin")).not.toBeInTheDocument()
  })
})

// ─── Logout ───────────────────────────────────────────────────────────────────

describe("AdminNav — logout", () => {
  it("calls logout when Log out is clicked", async () => {
    setupAuth()
    render(<AdminNav />)
    fireEvent.click(screen.getByRole("button", { name: /log out/i }))
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })
  })

  it("shows 'Logging out…' while logout is in progress", async () => {
    let resolveLogout!: () => void
    mockLogout.mockReturnValue(new Promise<void>((res) => { resolveLogout = res }))
    setupAuth()
    render(<AdminNav />)
    fireEvent.click(screen.getByRole("button", { name: /log out/i }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /logging out/i })).toBeInTheDocument()
    })
    resolveLogout()
  })

  it("disables the button while logging out", async () => {
    let resolveLogout!: () => void
    mockLogout.mockReturnValue(new Promise<void>((res) => { resolveLogout = res }))
    setupAuth()
    render(<AdminNav />)
    fireEvent.click(screen.getByRole("button", { name: /log out/i }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /logging out/i })).toBeDisabled()
    })
    resolveLogout()
  })

  it("does not call logout more than once if clicked multiple times", async () => {
    let resolveLogout!: () => void
    mockLogout.mockReturnValue(new Promise<void>((res) => { resolveLogout = res }))
    setupAuth()
    render(<AdminNav />)
    const btn = screen.getByRole("button", { name: /log out/i })
    fireEvent.click(btn)
    await waitFor(() => expect(btn).toBeDisabled())
    // Button is disabled — second click should have no effect
    fireEvent.click(btn)
    expect(mockLogout).toHaveBeenCalledTimes(1)
    resolveLogout()
  })
})

// ─── Accessibility ────────────────────────────────────────────────────────────

describe("AdminNav — accessibility", () => {
  it("renders as a header landmark", () => {
    setupAuth()
    render(<AdminNav />)
    expect(screen.getByRole("banner")).toBeInTheDocument()
  })

  it("logo is keyboard-navigable (rendered as an anchor)", () => {
    setupAuth()
    render(<AdminNav />)
    const logo = screen.getByText("propnest").closest("a")
    expect(logo?.tagName).toBe("A")
  })
})
