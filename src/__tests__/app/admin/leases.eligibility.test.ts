/**
 * Tests for the eligible-contract filter used by the Leases admin page.
 *
 * A Lease may only be created against a long-term Contract that doesn't
 * already have a Lease (docs/product/phase-2.md). There is no dedicated
 * "eligible contracts" backend endpoint, so this is computed client-side by
 * cross-referencing the loaded leases list's contract_id values.
 */

import { getEligibleContracts } from "@/app/admin/leases/page"
import type { Contract } from "@/types/contract"
import type { Lease } from "@/types/lease"

function makeContract(overrides: Partial<Contract>): Contract {
  return {
    id: "contract-1",
    property_id: "prop-1",
    tenant_id: "tenant-1",
    rental_type: "long_term",
    start_date: "2026-01-01",
    end_date: null,
    rent_amount: "15000.00",
    deposit: null,
    booking_source: "direct",
    status: "ACTIVE",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

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

describe("getEligibleContracts", () => {
  it("includes a long-term contract with no lease", () => {
    const contract = makeContract({ id: "c1", rental_type: "long_term" })
    expect(getEligibleContracts([contract], [])).toEqual([contract])
  })

  it("excludes a short-term contract", () => {
    const contract = makeContract({ id: "c1", rental_type: "short_term" })
    expect(getEligibleContracts([contract], [])).toEqual([])
  })

  it("excludes a long-term contract that already has a lease", () => {
    const contract = makeContract({ id: "c1", rental_type: "long_term" })
    const lease = makeLease({ contract_id: "c1" })
    expect(getEligibleContracts([contract], [lease])).toEqual([])
  })

  it("returns an empty array when there are no contracts", () => {
    expect(getEligibleContracts([], [])).toEqual([])
  })

  it("only excludes the specific contract referenced by a lease, not siblings", () => {
    const c1 = makeContract({ id: "c1", rental_type: "long_term" })
    const c2 = makeContract({ id: "c2", rental_type: "long_term" })
    const lease = makeLease({ contract_id: "c1" })
    expect(getEligibleContracts([c1, c2], [lease])).toEqual([c2])
  })
})
