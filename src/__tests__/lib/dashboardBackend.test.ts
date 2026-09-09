/**
 * Tests for lib/api/dashboardBackend.ts
 *
 * Covers the server-side call to FastAPI's dashboard aggregation endpoint,
 * including the detail-extraction logic used when the backend returns a
 * non-2xx response. `detail` is an untrusted external value — it can be any
 * JSON type, so these cases are enumerated from the JSON type space itself
 * rather than from any one backend's observed shape (mirrors
 * billingBackend.test.ts).
 */

import { backendGetDashboardSummary } from "@/lib/api/dashboardBackend"
import type { ApiError } from "@/types"
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
  late_payments: [
    {
      id: "billing-uuid-1",
      lease_id: "lease-uuid-1",
      period_start: "2026-01-01",
      period_end: "2026-01-31",
      due_date: "2026-01-05",
      amount_due: "15000.00",
      late_fee_applied: true,
      late_fee_amount_charged: "500.00",
      status: "overdue",
      overpaid_amount: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-10T00:00:00Z",
    },
  ],
  vacant_units: 2,
  expiring_leases: [
    {
      id: "lease-uuid-2",
      contract_id: "contract-uuid-2",
      monthly_rent: "20000.00",
      due_day: 1,
      billing_cycle: "monthly",
      security_deposit: null,
      advance_payment: null,
      late_fee_amount: null,
      late_fee_percent: null,
      grace_period_days: 0,
      renewal_option: "none",
      status: "ACTIVE",
      start_date: "2025-08-01",
      end_date: "2026-08-31",
      created_at: "2025-08-01T00:00:00Z",
      updated_at: "2025-08-01T00:00:00Z",
    },
  ],
  recent_payments: [
    {
      id: "payment-uuid-1",
      contract_id: "contract-uuid-1",
      billing_record_id: "billing-uuid-1",
      amount: "15000.00",
      paid_at: "2026-01-05T00:00:00Z",
      payment_method: "gcash",
      status: "PAID",
      reference_number: "REF-001",
      corrects_payment_id: null,
      created_at: "2026-01-05T00:00:00Z",
      updated_at: "2026-01-05T00:00:00Z",
    },
  ],
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe("backendGetDashboardSummary", () => {
  it("calls GET /dashboard/ with the bearer token and returns the parsed summary", async () => {
    mockFetch.mockReturnValue(mockResponse(mockSummary))

    const result = await backendGetDashboardSummary("token")

    expect(result).toEqual(mockSummary)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/dashboard\/$/),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      })
    )
  })

  it("throws ApiError with the backend's status on a non-2xx response", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Not authenticated" }, 401))

    await expect(backendGetDashboardSummary("bad-token")).rejects.toMatchObject({
      status: 401,
      detail: "Not authenticated",
    })
  })

  it("resolves without error on 204 instead of throwing on an empty JSON body", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error("No body")),
      } as Response)
    )

    await expect(backendGetDashboardSummary("token")).resolves.toBeUndefined()
  })
})

describe("backendGetDashboardSummary detail extraction", () => {
  it("uses a plain string detail as-is", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: "Something went wrong" }, 500))
    try {
      await backendGetDashboardSummary("token")
      throw new Error("expected backendGetDashboardSummary to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("Something went wrong")
    }
  })

  it("joins FastAPI's structured 422 validation error array by msg", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        {
          detail: [
            { loc: ["query", "recent_payments_limit"], msg: "field required", type: "missing" },
          ],
        },
        422
      )
    )
    try {
      await backendGetDashboardSummary("token")
      throw new Error("expected backendGetDashboardSummary to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("field required")
    }
  })

  it("stringifies a plain-object detail with no msg field", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: { code: "AGGREGATION_FAILED" } }, 500))
    try {
      await backendGetDashboardSummary("token")
      throw new Error("expected backendGetDashboardSummary to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe(JSON.stringify({ code: "AGGREGATION_FAILED" }))
    }
  })

  it("falls back to a generic message when detail is an empty array", async () => {
    mockFetch.mockReturnValue(mockResponse({ detail: [] }, 500))
    try {
      await backendGetDashboardSummary("token")
      throw new Error("expected backendGetDashboardSummary to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("Request failed with status 500")
    }
  })

  it("falls back to a generic message when the response body isn't JSON", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.reject(new Error("not json")),
      } as unknown as Response)
    )
    try {
      await backendGetDashboardSummary("token")
      throw new Error("expected backendGetDashboardSummary to reject")
    } catch (err) {
      expect((err as ApiError).detail).toBe("Request failed with status 503")
    }
  })
})
