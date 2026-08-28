/**
 * Tests for app/dashboard/page.tsx.
 *
 * DashboardMetrics has its own dedicated test (DashboardMetrics.test.tsx)
 * and is mocked out here — this test's job is the page's own
 * responsibilities: auth redirect, role-gated nav cards, and mounting the
 * metrics component alongside them, not the metrics fetch itself.
 */

import { render, screen } from "@testing-library/react"

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT")
  }),
}))

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ logout: jest.fn() }),
}))

jest.mock("@/components/ui/DashboardMetrics", () => ({
  DashboardMetrics: () => <div data-testid="dashboard-metrics" />,
}))

import { getCurrentUser } from "@/lib/auth/session"
import DashboardPage from "@/app/dashboard/page"

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

const baseUser = {
  id: "user-1",
  username: "mgr",
  email: "mgr@propnest.com",
  full_name: "Manager User",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

describe("DashboardPage", () => {
  it("redirects to /login when there is no authenticated user", async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    await expect(DashboardPage()).rejects.toThrow("NEXT_REDIRECT")
  })

  it("renders DashboardMetrics alongside the existing nav cards for an admin", async () => {
    mockGetCurrentUser.mockResolvedValue({ ...baseUser, role: "admin" })
    render(await DashboardPage())

    expect(screen.getByTestId("dashboard-metrics")).toBeInTheDocument()
    expect(screen.getByText("Users")).toBeInTheDocument()
    expect(screen.getByText("Properties")).toBeInTheDocument()
    expect(screen.getByText("Contracts")).toBeInTheDocument()
  })

  it("hides admin-only cards for a manager but still shows metrics and manager-visible cards", async () => {
    mockGetCurrentUser.mockResolvedValue({ ...baseUser, role: "manager" })
    render(await DashboardPage())

    expect(screen.getByTestId("dashboard-metrics")).toBeInTheDocument()
    expect(screen.queryByText("Users")).not.toBeInTheDocument()
    expect(screen.getByText("Contracts")).toBeInTheDocument()
  })
})
