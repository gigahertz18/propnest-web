/**
 * Tests for the human-readable label helpers used by the Billing admin page.
 *
 * Contracts, leases, and billing records are all identified by UUID on the
 * wire, but a user has no way to recognize which UUID points to which
 * record — these helpers resolve each one down to the property/tenant names
 * (and period/status, for a billing record) it actually belongs to.
 */

import { contractLabel, leaseLabel, billingRecordLabel } from "@/app/admin/billing/page"
import type { Contract } from "@/types/contract"
import type { Property } from "@/types/property"
import type { Tenant } from "@/types/tenant"
import type { Lease } from "@/types/lease"
import type { BillingRecord } from "@/types/billing"

const property: Property = {
  id: "prop-1",
  name: "Sunset Villa",
  address: "123 Main St, Laguna",
  description: null,
  status: "occupied",
  is_active: true,
  manager_id: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const tenant: Tenant = {
  id: "tenant-1",
  full_name: "Jane Doe",
  email: "jane@example.com",
  phone_number: "+63 900 000 0000",
  date_of_birth: "1995-01-01",
  current_address: "123 Main St, Manila",
  occupation: null,
  notes: null,
  is_active: true,
  user_id: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const contract: Contract = {
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
}

const lease: Lease = {
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
}

const billingRecord: BillingRecord = {
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
}

describe("contractLabel", () => {
  it("resolves to the property and tenant names", () => {
    expect(contractLabel(contract, [property], [tenant])).toBe("Sunset Villa — Jane Doe")
  })

  it("falls back to the raw id when the property is unknown", () => {
    expect(contractLabel(contract, [], [tenant])).toBe("prop-1 — Jane Doe")
  })

  it("falls back to the raw id when the tenant is unknown", () => {
    expect(contractLabel(contract, [property], [])).toBe("Sunset Villa — tenant-1")
  })
})

describe("leaseLabel", () => {
  it("resolves through the lease's contract to the property and tenant names", () => {
    expect(leaseLabel(lease, [contract], [property], [tenant])).toBe("Sunset Villa — Jane Doe")
  })

  it("falls back to the lease's raw id when its contract is unknown", () => {
    expect(leaseLabel(lease, [], [property], [tenant])).toBe("lease-1")
  })
})

describe("billingRecordLabel", () => {
  it("resolves to lease, period, and status", () => {
    expect(billingRecordLabel(billingRecord, [lease], [contract], [property], [tenant])).toBe(
      "Sunset Villa — Jane Doe · Jan 1, 2026 – Jan 31, 2026 · pending"
    )
  })

  it("humanizes an underscored status", () => {
    const partiallyPaid = { ...billingRecord, status: "partially_paid" as const }
    expect(billingRecordLabel(partiallyPaid, [lease], [contract], [property], [tenant])).toContain(
      "partially paid"
    )
  })

  it("falls back to the record's raw lease id when the lease is unknown", () => {
    expect(billingRecordLabel(billingRecord, [], [contract], [property], [tenant])).toContain(
      "lease-1"
    )
  })
})
