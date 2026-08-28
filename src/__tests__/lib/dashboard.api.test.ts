/**
 * Tests for lib/api/dashboard.ts — client-side dashboard API wrapper.
 * Calls the Next.js Route Handler, mirrors billing.ts/receipts.ts conventions.
 */

import { dashboardApi } from "@/lib/api/dashboard"
import type { DashboardSummary } from "@/types/dashboard"

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

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
  mockFetch.mockReset()
})

describe("dashboardApi", () => {
  it("get calls GET /api/dashboard and returns the parsed summary", async () => {
    mockFetch.mockReturnValue(mockResponse(mockSummary))

    const result = await dashboardApi.get()

    expect(result).toEqual(mockSummary)
    expect(mockFetch).toHaveBeenCalledWith("/api/dashboard", expect.any(Object))
  })

  it("propagates a structured error detail on failure", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))

    await expect(dashboardApi.get()).rejects.toMatchObject({
      status: 401,
      detail: "Not authenticated",
    })
  })

  it("falls back to a generic message when the response body isn't JSON", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("not json")),
      } as unknown as Response)
    )

    await expect(dashboardApi.get()).rejects.toMatchObject({
      status: 500,
      detail: "Request failed with status 500",
    })
  })
})
