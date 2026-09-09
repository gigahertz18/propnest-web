/**
 * Tests for the helper that resolves a contract's lease ids.
 *
 * Selecting a contract in the Record Payment form needs to fetch billing
 * records for that contract's lease(s) — this join (Lease.contract_id ->
 * lease id) is what determines which leases to fetch for.
 */

import { leaseIdsForContract } from "@/app/admin/billing/page"
import type { Lease } from "@/types/lease"

function makeLease(overrides: Partial<Lease>): Lease {
  return {
    id: "lease-1",
    contract_id: "contract-1",
    monthly_rent: "15000.00",
    due_day: 5,
    billing_cycle: "monthly",
    security_deposit: null,
    advance_payment: null,
    late_fee_amount: null,
    late_fee_percent: null,
    grace_period_days: 0,
    renewal_option: "none",
    status: "ACTIVE",
    start_date: "2026-01-01",
    end_date: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("leaseIdsForContract", () => {
  it("returns the lease id belonging to the given contract", () => {
    const leases = [makeLease({ id: "lease-1", contract_id: "contract-1" })]
    expect(leaseIdsForContract(leases, "contract-1")).toEqual(["lease-1"])
  })

  it("returns every lease id when a contract has more than one lease", () => {
    const leases = [
      makeLease({ id: "lease-1", contract_id: "contract-1" }),
      makeLease({ id: "lease-2", contract_id: "contract-1" }),
    ]
    expect(leaseIdsForContract(leases, "contract-1")).toEqual(["lease-1", "lease-2"])
  })

  it("excludes leases belonging to other contracts", () => {
    const leases = [
      makeLease({ id: "lease-1", contract_id: "contract-1" }),
      makeLease({ id: "lease-2", contract_id: "contract-2" }),
    ]
    expect(leaseIdsForContract(leases, "contract-1")).toEqual(["lease-1"])
  })

  it("returns an empty array when the contract has no leases", () => {
    const leases = [makeLease({ id: "lease-1", contract_id: "contract-1" })]
    expect(leaseIdsForContract(leases, "contract-2")).toEqual([])
  })

  it("returns an empty array when there are no leases at all", () => {
    expect(leaseIdsForContract([], "contract-1")).toEqual([])
  })
})
