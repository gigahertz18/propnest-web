import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import type { BillingRecord } from "@/types/billing"
import type { Contract } from "@/types/contract"
import type { Lease } from "@/types/lease"
import type { Payment } from "@/types/payment"
import type { Property } from "@/types/property"
import type { Tenant } from "@/types/tenant"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Amount strings are fixed at 2 decimal places (mirrors the backend's
// Numeric(12, 2) columns) — converting to integer cents avoids floating
// point drift when summing payments.
function toCents(amount: string): number {
  return Math.round(parseFloat(amount) * 100)
}

function centsToAmount(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * The backend's BillingRecordResponse doesn't expose a single "current
 * balance" field — it exposes amount_due, late_fee_amount_charged, status,
 * and overpaid_amount — so the balance shown in the UI is derived
 * client-side from those plus the payments already recorded against this
 * billing record, mirroring the backend's own cumulative-payment logic in
 * LeaseBillingService.apply_payment.
 */
export function billingBalance(record: BillingRecord, payments: Payment[]): string {
  if (record.status === "paid" || record.status === "written_off") {
    return record.overpaid_amount ? `-${record.overpaid_amount}` : "0.00"
  }
  const totalDueCents =
    toCents(record.amount_due) + toCents(record.late_fee_amount_charged ?? "0.00")
  const paidCents = payments
    .filter((p) => p.billing_record_id === record.id && p.status !== "VOIDED")
    .reduce((sum, p) => sum + toCents(p.amount), 0)
  return centsToAmount(totalDueCents - paidCents)
}

/**
 * Contracts, leases, and billing records are all identified by UUID on the
 * wire, but nobody memorizes a UUID — every place one would otherwise be
 * shown or picked from a list is resolved down to the property/tenant names
 * (and period/status, for a billing record) it actually belongs to.
 */
export function contractLabel(contract: Contract, properties: Property[], tenants: Tenant[]) {
  const propertyName =
    properties.find((p) => p.id === contract.property_id)?.name ?? contract.property_id
  const tenantName =
    tenants.find((t) => t.id === contract.tenant_id)?.full_name ?? contract.tenant_id
  return `${propertyName} — ${tenantName}`
}

export function leaseLabel(
  lease: Lease,
  contracts: Contract[],
  properties: Property[],
  tenants: Tenant[]
) {
  const contract = contracts.find((c) => c.id === lease.contract_id)
  return contract ? contractLabel(contract, properties, tenants) : lease.id
}

export function billingRecordLabel(
  record: BillingRecord,
  leases: Lease[],
  contracts: Contract[],
  properties: Property[],
  tenants: Tenant[]
) {
  const lease = leases.find((l) => l.id === record.lease_id)
  const leaseName = lease ? leaseLabel(lease, contracts, properties, tenants) : record.lease_id
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
  const periodStart = new Date(record.period_start).toLocaleDateString("en-US", dateOptions)
  const periodEnd = new Date(record.period_end).toLocaleDateString("en-US", dateOptions)
  return `${leaseName} · ${periodStart} – ${periodEnd} · ${record.status.replace(/_/g, " ")}`
}

/**
 * The "check existing record" combobox can only offer records the page has
 * already seen (the backend has no list endpoint), so on load the page
 * proactively resolves every billing record referenced by an already-loaded
 * payment — otherwise a first-time visitor sees an empty combobox with
 * nothing to pick, even though real records exist.
 */
export function billingRecordIdsToResolve(
  payments: Payment[],
  cache: Record<string, BillingRecord>
): string[] {
  const ids = new Set<string>()
  for (const payment of payments) {
    if (payment.billing_record_id && !cache[payment.billing_record_id]) {
      ids.add(payment.billing_record_id)
    }
  }
  return [...ids]
}

// A contract can have more than one lease, so the Record Payment form's
// billing-record combobox needs every lease belonging to the selected
// contract fetched, not just one.
export function leaseIdsForContract(leases: Lease[], contractId: string): string[] {
  return leases.filter((l) => l.contract_id === contractId).map((l) => l.id)
}

/**
 * A Lease may only be created against a long-term Contract that doesn't
 * already have a Lease (docs/product/phase-2.md). There is no dedicated
 * "eligible contracts" backend endpoint, so this is computed client-side by
 * cross-referencing the loaded leases list's contract_id values.
 */
export function getEligibleContracts(contracts: Contract[], leases: Lease[]): Contract[] {
  const contractIdsWithLease = new Set(leases.map((l) => l.contract_id))
  return contracts.filter((c) => c.rental_type === "long_term" && !contractIdsWithLease.has(c.id))
}
