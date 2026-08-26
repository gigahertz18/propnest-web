/**
 * Tests for the outstanding-balance helper used by the Billing admin page.
 *
 * The backend's BillingRecordResponse doesn't expose a single "current
 * balance" field — it exposes amount_due, late_fee_amount_charged, status,
 * and overpaid_amount — so the balance shown in the UI is derived
 * client-side from those plus the payments recorded against the record.
 */

import { billingBalance } from "@/app/admin/billing/page"
import type { BillingRecord } from "@/types/billing"
import type { Payment } from "@/types/payment"

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

function makePayment(overrides: Partial<Payment>): Payment {
  return {
    id: "payment-1",
    contract_id: "contract-1",
    billing_record_id: "billing-1",
    amount: "0.00",
    paid_at: "2026-01-10T00:00:00Z",
    payment_method: null,
    status: "PAID",
    reference_number: null,
    corrects_payment_id: null,
    created_at: "2026-01-10T00:00:00Z",
    updated_at: "2026-01-10T00:00:00Z",
    ...overrides,
  }
}

describe("billingBalance", () => {
  it("returns the full amount due when pending with no payments", () => {
    expect(billingBalance(makeRecord({ status: "pending", amount_due: "15000.00" }), [])).toBe(
      "15000.00"
    )
  })

  it("returns the full amount due when overdue with no payments", () => {
    expect(billingBalance(makeRecord({ status: "overdue", amount_due: "15500.00" }), [])).toBe(
      "15500.00"
    )
  })

  it("subtracts recorded payments when partially paid", () => {
    const record = makeRecord({ id: "billing-1", status: "partially_paid", amount_due: "15000.00" })
    const payments = [makePayment({ billing_record_id: "billing-1", amount: "10000.00" })]
    expect(billingBalance(record, payments)).toBe("5000.00")
  })

  it("ignores voided payments", () => {
    const record = makeRecord({ id: "billing-1", status: "partially_paid", amount_due: "15000.00" })
    const payments = [
      makePayment({ billing_record_id: "billing-1", amount: "10000.00", status: "VOIDED" }),
    ]
    expect(billingBalance(record, payments)).toBe("15000.00")
  })

  it("ignores payments linked to a different billing record", () => {
    const record = makeRecord({ id: "billing-1", status: "pending", amount_due: "15000.00" })
    const payments = [makePayment({ billing_record_id: "billing-2", amount: "10000.00" })]
    expect(billingBalance(record, payments)).toBe("15000.00")
  })

  it("includes the late fee in the amount owed", () => {
    const record = makeRecord({
      id: "billing-1",
      status: "overdue",
      amount_due: "15000.00",
      late_fee_amount_charged: "500.00",
    })
    const payments = [makePayment({ billing_record_id: "billing-1", amount: "10000.00" })]
    expect(billingBalance(record, payments)).toBe("5500.00")
  })

  it("returns zero when paid", () => {
    expect(billingBalance(makeRecord({ status: "paid" }), [])).toBe("0.00")
  })

  it("returns zero when written off", () => {
    expect(billingBalance(makeRecord({ status: "written_off" }), [])).toBe("0.00")
  })

  it("returns a negative balance (credit) when overpaid", () => {
    expect(billingBalance(makeRecord({ status: "paid", overpaid_amount: "500.00" }), [])).toBe(
      "-500.00"
    )
  })
})
