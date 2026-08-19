/**
 * Tests for the helper that decides which billing records to auto-resolve
 * on page load.
 *
 * The "check existing record" combobox can only offer records the page has
 * already seen (the backend has no list endpoint), so on load the page
 * should proactively resolve every billing record referenced by an already-
 * loaded payment — otherwise a user visiting for the first time sees an
 * empty combobox with nothing to pick, even though real records exist.
 */

import { billingRecordIdsToResolve } from "@/app/admin/billing/page"
import type { Payment } from "@/types/payment"
import type { BillingRecord } from "@/types/billing"

function makePayment(overrides: Partial<Payment>): Payment {
  return {
    id: "payment-1",
    contract_id: "contract-1",
    billing_record_id: null,
    amount: "15000.00",
    paid_at: "2026-01-05T00:00:00Z",
    payment_method: null,
    status: "PAID",
    reference_number: null,
    corrects_payment_id: null,
    created_at: "2026-01-05T00:00:00Z",
    updated_at: "2026-01-05T00:00:00Z",
    ...overrides,
  }
}

function makeBillingRecord(overrides: Partial<BillingRecord>): BillingRecord {
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

describe("billingRecordIdsToResolve", () => {
  it("returns billing record ids referenced by payments", () => {
    const payments = [makePayment({ billing_record_id: "billing-1" })]
    expect(billingRecordIdsToResolve(payments, {})).toEqual(["billing-1"])
  })

  it("skips payments with no billing record", () => {
    const payments = [makePayment({ billing_record_id: null })]
    expect(billingRecordIdsToResolve(payments, {})).toEqual([])
  })

  it("de-duplicates ids shared by multiple payments", () => {
    const payments = [
      makePayment({ id: "p1", billing_record_id: "billing-1" }),
      makePayment({ id: "p2", billing_record_id: "billing-1" }),
    ]
    expect(billingRecordIdsToResolve(payments, {})).toEqual(["billing-1"])
  })

  it("excludes ids already present in the cache", () => {
    const payments = [
      makePayment({ id: "p1", billing_record_id: "billing-1" }),
      makePayment({ id: "p2", billing_record_id: "billing-2" }),
    ]
    const cache = { "billing-1": makeBillingRecord({ id: "billing-1" }) }
    expect(billingRecordIdsToResolve(payments, cache)).toEqual(["billing-2"])
  })

  it("returns an empty array when there are no payments", () => {
    expect(billingRecordIdsToResolve([], {})).toEqual([])
  })
})
