/**
 * Tests for the outstanding-balance helper used by the Billing admin page.
 *
 * The backend's BillingRecordResponse doesn't expose a single "current
 * balance" field — it exposes amount_due, status, and overpaid_amount —
 * so the balance shown in the UI is derived client-side from those.
 */

import { billingBalance } from "@/app/admin/billing/page"
import type { BillingRecord } from "@/types/billing"

function makeRecord(overrides: Partial<BillingRecord>): BillingRecord {
  return {
    id: "billing-1",
    lease_id: "lease-1",
    period_start: "2026-01-01",
    period_end: "2026-01-31",
    due_date: "2026-01-05",
    amount_due: "15000.00",
    late_fee_applied: false,
    late_fee_amount_charged: null,
    status: "pending",
    overpaid_amount: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("billingBalance", () => {
  it("returns the full amount due when pending", () => {
    expect(billingBalance(makeRecord({ status: "pending", amount_due: "15000.00" }))).toBe(
      "15000.00"
    )
  })

  it("returns the full amount due when overdue", () => {
    expect(billingBalance(makeRecord({ status: "overdue", amount_due: "15500.00" }))).toBe(
      "15500.00"
    )
  })

  it("returns the amount due when partially paid", () => {
    expect(billingBalance(makeRecord({ status: "partially_paid", amount_due: "5000.00" }))).toBe(
      "5000.00"
    )
  })

  it("returns zero when paid", () => {
    expect(billingBalance(makeRecord({ status: "paid" }))).toBe("0.00")
  })

  it("returns zero when written off", () => {
    expect(billingBalance(makeRecord({ status: "written_off" }))).toBe("0.00")
  })

  it("returns a negative balance (credit) when overpaid", () => {
    expect(billingBalance(makeRecord({ status: "paid", overpaid_amount: "500.00" }))).toBe(
      "-500.00"
    )
  })
})
