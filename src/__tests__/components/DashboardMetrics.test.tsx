/**
 * Tests for the DashboardMetrics component.
 *
 * Covers: loading skeleton, all six required metrics rendering from a
 * mocked DashboardSummaryResponse, empty states for the two list sections,
 * and a failed initial fetch with retry (mirrors ReceiptHistory.test.tsx's
 * conventions for a self-contained load/error/retry component).
 */

import { render, screen, fireEvent } from "@testing-library/react"

import { DashboardMetrics } from "@/components/ui/DashboardMetrics"
import { dashboardApi } from "@/lib/api/dashboard"
import type { DashboardSummary } from "@/types/dashboard"

jest.mock("@/lib/api/dashboard", () => ({
  dashboardApi: {
    get: jest.fn(),
  },
}))

const mockGet = dashboardApi.get as jest.MockedFunction<typeof dashboardApi.get>

const fullSummary: DashboardSummary = {
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

const emptySummary: DashboardSummary = {
  collected_this_month: "0.00",
  outstanding: "0.00",
  total_credits: "0.00",
  late_payments: [],
  vacant_units: 0,
  expiring_leases: [],
  recent_payments: [],
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("DashboardMetrics", () => {
  it("shows a loading skeleton before the fetch resolves", () => {
    mockGet.mockReturnValue(new Promise(() => {})) // never resolves within this test
    const { container } = render(<DashboardMetrics />)

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
  })

  it("renders all six required metrics from a mocked DashboardSummaryResponse", async () => {
    mockGet.mockResolvedValue(fullSummary)
    render(<DashboardMetrics />)

    expect(await screen.findByText("Collected This Month")).toBeInTheDocument()
    expect(screen.getByText("45000.00")).toBeInTheDocument()

    expect(screen.getByText("Outstanding")).toBeInTheDocument()
    expect(screen.getByText("12000.00")).toBeInTheDocument()

    expect(screen.getByText("Late Payments")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument() // late_payments.length

    expect(screen.getByText("Vacant Units")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()

    expect(screen.getByText("Expiring Leases")).toBeInTheDocument()
    expect(screen.getByText(/ends Aug 31, 2026 · 20000\.00/)).toBeInTheDocument()

    expect(screen.getByText("Recent Payments")).toBeInTheDocument()
    expect(screen.getByText("15000.00")).toBeInTheDocument()
  })

  it("shows empty-state copy for expiring leases and recent payments when both are empty", async () => {
    mockGet.mockResolvedValue(emptySummary)
    render(<DashboardMetrics />)

    expect(await screen.findByText(/no expiring leases/i)).toBeInTheDocument()
    expect(screen.getByText(/no recent payments/i)).toBeInTheDocument()
  })

  it("shows a retryable error when the initial fetch fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("network down"))
    mockGet.mockResolvedValueOnce(fullSummary)
    render(<DashboardMetrics />)

    expect(await screen.findByText(/failed to load dashboard metrics/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /retry/i }))

    expect(await screen.findByText("Collected This Month")).toBeInTheDocument()
    expect(mockGet).toHaveBeenCalledTimes(2)
  })
})
