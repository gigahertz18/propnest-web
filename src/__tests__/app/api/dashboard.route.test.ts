/**
 * @jest-environment node
 *
 * Tests for the dashboard Route Handler:
 *   GET /api/dashboard → route.ts
 */

import { ApiError } from "@/types"

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/api/dashboardBackend", () => ({
  backendGetDashboardSummary: jest.fn(),
}))

jest.mock("@/lib/auth/session", () => ({
  getToken: jest.fn(),
}))

import * as backend from "@/lib/api/dashboardBackend"
import * as session from "@/lib/auth/session"
import { GET } from "@/app/api/dashboard/route"
import type { DashboardSummary } from "@/types/dashboard"

const mockGetSummary = backend.backendGetDashboardSummary as jest.MockedFunction<
  typeof backend.backendGetDashboardSummary
>
const mockGetToken = session.getToken as jest.MockedFunction<typeof session.getToken>

const mockSummary: DashboardSummary = {
  collected_this_month: "45000.00",
  outstanding: "12000.00",
  total_credits: "0.00",
  late_payments: [],
  vacant_units: 2,
  expiring_leases: [],
  recent_payments: [],
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("GET /api/dashboard", () => {
  it("returns 401 when no token", async () => {
    mockGetToken.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns 200 with the dashboard summary", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGetSummary.mockResolvedValue(mockSummary)
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(mockSummary)
    expect(mockGetSummary).toHaveBeenCalledWith("token")
  })

  it("forwards a structured ApiError status and detail from the backend", async () => {
    mockGetToken.mockResolvedValue("token")
    mockGetSummary.mockRejectedValue(new ApiError(503, "Aggregation temporarily unavailable"))
    const res = await GET()
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ detail: "Aggregation temporarily unavailable" })
  })

  it("returns 500 on unexpected error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockResolvedValue("token")
    mockGetSummary.mockRejectedValue(new Error("Unexpected"))
    const res = await GET()
    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})
