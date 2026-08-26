"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"

import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import type { Payment, PaymentCreatePayload, PaymentUpdatePayload } from "@/types/payment"
import type { BillingRecord } from "@/types/billing"
import type { Contract } from "@/types/contract"
import type { Lease } from "@/types/lease"
import type { Property } from "@/types/property"
import type { Tenant } from "@/types/tenant"
import { ApiError } from "@/types"
import { paymentsApi } from "@/lib/api/payments"
import { billingApi } from "@/lib/api/billing"
import { contractsApi } from "@/lib/api/contracts"
import { leasesApi } from "@/lib/api/leases"
import { propertiesApi } from "@/lib/api/properties"
import { tenantsApi } from "@/lib/api/tenants"
import Modal from "@/components/ui/Modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox"

import { PaymentForm } from "@/components/ui/PaymentForm"
import { ReceiptHistory } from "@/components/ui/ReceiptHistory"

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; payment: Payment }
  | { type: "delete"; payment: Payment }
  | { type: "receipts"; payment: Payment }

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return `${leaseName} · ${formatDate(record.period_start)} – ${formatDate(record.period_end)} · ${record.status.replace(/_/g, " ")}`
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function BillingStatusBadge({ status }: { status: BillingRecord["status"] }) {
  const styles: Record<BillingRecord["status"], string> = {
    pending: "bg-neutral-100 text-neutral-600",
    partially_paid: "bg-amber-50 text-amber-700",
    paid: "bg-green-50 text-green-700",
    overdue: "bg-red-50 text-red-700",
    written_off: "bg-neutral-100 text-neutral-500",
  }
  return (
    <span
      className={["inline-flex rounded-full px-2.5 py-1 text-xs font-medium", styles[status]].join(
        " "
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  )
}

function PaymentStatusBadge({ status }: { status: Payment["status"] }) {
  const styles: Record<Payment["status"], string> = {
    PAID: "bg-green-50 text-green-700",
    PENDING: "bg-amber-50 text-amber-700",
    VOIDED: "bg-neutral-100 text-neutral-500",
    REFUNDED: "bg-blue-50 text-blue-700",
  }
  return (
    <span
      className={["inline-flex rounded-full px-2.5 py-1 text-xs font-medium", styles[status]].join(
        " "
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminBillingPage() {
  const { isAdmin, isAtLeastManager, loading: authLoading } = useAuth()
  const router = useRouter()

  const [payments, setPayments] = useState<Payment[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [leases, setLeases] = useState<Lease[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetching, setFetching] = useState(true)
  const [modal, setModal] = useState<ModalState>({ type: "closed" })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Every billing record seen on this page (generated, refreshed, listed, or
  // looked up) is cached here (by id) so it can be picked by human-readable
  // label everywhere else on this page instead of typed by UUID.
  const [billingRecordCache, setBillingRecordCache] = useState<Record<string, BillingRecord>>({})
  const [resolvingBillingId, setResolvingBillingId] = useState<string | null>(null)
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null)
  // Periods are always sequential (each one picks up exactly where the last
  // left off), so "generate ahead" means calling generate N times in a row
  // rather than letting a caller pick an arbitrary target period.
  const [generateCount, setGenerateCount] = useState("1")
  const [selectedBillingRecord, setSelectedBillingRecord] = useState<BillingRecord | null>(null)
  const [billingActionLoading, setBillingActionLoading] = useState(false)
  const [lastBillingRecord, setLastBillingRecord] = useState<BillingRecord | null>(null)
  const [leaseBillingHistory, setLeaseBillingHistory] = useState<BillingRecord[]>([])
  const [leaseBillingHistoryLoading, setLeaseBillingHistoryLoading] = useState(false)

  const knownBillingRecords = Object.values(billingRecordCache)

  useEffect(() => {
    if (!authLoading && !isAtLeastManager) router.replace("/dashboard")
  }, [authLoading, isAtLeastManager, router])

  const TOAST_DURATION_MS = 3 * 60 * 1000

  const showToast = (message: string, variant: "success" | "error" = "success") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ message, variant })
    toastTimeoutRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS)
  }

  const dismissToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast(null)
  }

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  const loadData = useCallback(async () => {
    setFetching(true)
    setFetchError(null)
    try {
      const [paymentList, contractList, leaseList, propertyList, tenantList] = await Promise.all([
        paymentsApi.list(),
        contractsApi.list(),
        leasesApi.list(),
        propertiesApi.list(),
        tenantsApi.list(),
      ])
      setPayments(paymentList)
      setContracts(contractList)
      setLeases(leaseList)
      setProperties(propertyList)
      setTenants(tenantList)

      // Fire-and-forget: resolve every billing record already referenced by
      // a payment so the "check existing record" combobox has something to
      // offer immediately, instead of staying empty until a user manually
      // generates or opens one.
      setBillingRecordCache((prevCache) => {
        const idsToResolve = billingRecordIdsToResolve(paymentList, prevCache)
        if (idsToResolve.length > 0) {
          Promise.allSettled(idsToResolve.map((id) => billingApi.get(id))).then((results) => {
            for (const result of results) {
              if (result.status === "fulfilled") cacheBillingRecord(result.value)
            }
          })
        }
        return prevCache
      })
    } catch (err) {
      setFetchError(err instanceof ApiError ? err.detail : "Failed to load billing data")
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading && isAtLeastManager) loadData()
  }, [authLoading, isAtLeastManager, loadData])

  function cacheBillingRecord(record: BillingRecord) {
    setBillingRecordCache((prev) => ({ ...prev, [record.id]: record }))
  }

  function contractOf(contractId: string) {
    return contracts.find((c) => c.id === contractId) ?? null
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLease) return
    const count = Math.min(Math.max(parseInt(generateCount, 10) || 1, 1), 24)
    setBillingActionLoading(true)
    const generated: BillingRecord[] = []
    try {
      // Sequential, not parallel: each call's period_start depends on the
      // previous one having already committed, so they must run one at a time.
      for (let i = 0; i < count; i++) {
        const record = await billingApi.generate({ lease_id: selectedLease.id })
        generated.push(record)
        cacheBillingRecord(record)
      }
      setLastBillingRecord(generated[generated.length - 1])
      setLeaseBillingHistory((prev) => [...prev, ...generated])
      showToast(
        generated.length === 1
          ? "Billing record generated"
          : `${generated.length} billing records generated`
      )
    } catch (err) {
      if (generated.length > 0) {
        setLastBillingRecord(generated[generated.length - 1])
        setLeaseBillingHistory((prev) => [...prev, ...generated])
      }
      const detail = err instanceof ApiError ? err.detail : "Failed to generate billing record"
      showToast(
        generated.length > 0 ? `Generated ${generated.length} of ${count} — ${detail}` : detail,
        "error"
      )
    } finally {
      setBillingActionLoading(false)
    }
  }

  async function handleEvaluateOverdue(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBillingRecord) return
    setBillingActionLoading(true)
    try {
      const record = await billingApi.evaluateOverdue(selectedBillingRecord.id)
      cacheBillingRecord(record)
      setLastBillingRecord(record)
      showToast("Billing status refreshed")
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Failed to evaluate billing record", "error")
    } finally {
      setBillingActionLoading(false)
    }
  }

  // Resolves an unlabeled billing record referenced by a payment (e.g. one
  // recorded in an earlier session) into a human-readable one, on demand.
  async function handleResolveBillingRecord(id: string) {
    setResolvingBillingId(id)
    try {
      const record = await billingApi.get(id)
      cacheBillingRecord(record)
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Failed to load billing record", "error")
    } finally {
      setResolvingBillingId(null)
    }
  }

  useEffect(() => {
    if (!selectedLease) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLeaseBillingHistory([])
      return
    }
    let cancelled = false
    setLeaseBillingHistoryLoading(true)
    billingApi
      .list(selectedLease.id)
      .then((records) => {
        if (cancelled) return
        setLeaseBillingHistory(records)
        setBillingRecordCache((prev) => {
          const next = { ...prev }
          for (const record of records) next[record.id] = record
          return next
        })
      })
      .catch((err) => {
        if (cancelled) return
        showToast(err instanceof ApiError ? err.detail : "Failed to load billing history", "error")
      })
      .finally(() => {
        if (!cancelled) setLeaseBillingHistoryLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLease])

  async function handleCreate(payload: PaymentCreatePayload | PaymentUpdatePayload) {
    const created = await paymentsApi.create(payload as PaymentCreatePayload)
    setPayments((prev) => [created, ...prev])
    setModal({ type: "closed" })
    showToast("Payment recorded")

    // The resulting billing status must be visible immediately after
    // payment submission — re-evaluate the targeted billing record so its
    // current status/balance reflects this payment right away.
    if (created.billing_record_id) {
      try {
        const record = await billingApi.evaluateOverdue(created.billing_record_id)
        cacheBillingRecord(record)
        setLastBillingRecord(record)
      } catch {
        /* the payment itself succeeded; a stale billing panel isn't fatal */
      }
    }
  }

  async function handleEdit(payload: PaymentCreatePayload | PaymentUpdatePayload) {
    if (modal.type !== "edit") return
    const updated = await paymentsApi.update(modal.payment.id, payload as PaymentUpdatePayload)
    setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    setModal({ type: "closed" })
    showToast("Payment updated")
  }

  async function handleDelete() {
    if (modal.type !== "delete") return
    setDeleteLoading(true)
    try {
      await paymentsApi.delete(modal.payment.id)
      setPayments((prev) => prev.filter((p) => p.id !== modal.payment.id))
      showToast("Payment deleted")
      setModal({ type: "closed" })
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Delete failed", "error")
    } finally {
      setDeleteLoading(false)
    }
  }

  if (authLoading || !isAtLeastManager) return null

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          role={toast.variant === "error" ? "alert" : "status"}
          className={[
            "fixed top-5 right-5 z-[100] flex max-w-sm items-start gap-2 rounded-xl px-4 py-3 text-sm break-words whitespace-normal text-white shadow-lg",
            toast.variant === "error" ? "bg-red-600" : "bg-neutral-900",
          ].join(" ")}
        >
          <button
            onClick={dismissToast}
            aria-label="Dismiss"
            className="-ml-1 flex h-4 w-4 flex-shrink-0 items-center justify-center opacity-80 hover:opacity-100"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1 1l10 10M11 1L1 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-white px-6 py-5">
        <div className="mx-auto max-w-5xl space-y-3">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8l4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Billing &amp; Payments</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Check billing-record status and record payments
              </p>
            </div>
            <Button
              onClick={() => setModal({ type: "create" })}
              className="bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:opacity-95"
            >
              + Record payment
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
        {fetchError && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              {fetchError}
              <button onClick={loadData} className="ml-4 underline underline-offset-2">
                Retry
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Billing-record status panel */}
        <div className="overflow-hidden rounded-xl border bg-white p-6">
          <h2 className="text-sm font-semibold">Billing-record status</h2>
          <p className="text-muted-foreground mt-0.5 mb-4 text-xs">
            Generate the next billing record for a lease, or re-check an existing one&apos;s balance
            and overdue status.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <form onSubmit={handleGenerate} className="space-y-3">
              <p className="text-xs font-medium text-neutral-500">Generate next record</p>
              <div className="space-y-1.5">
                <Label htmlFor="generate_lease_id">Lease</Label>
                <Combobox
                  items={leases}
                  value={selectedLease}
                  onValueChange={setSelectedLease}
                  itemToStringLabel={(lease: Lease) =>
                    leaseLabel(lease, contracts, properties, tenants)
                  }
                  disabled={billingActionLoading}
                >
                  <ComboboxInputGroup>
                    <ComboboxInput
                      id="generate_lease_id"
                      placeholder="Search leases by property or tenant…"
                      required
                    />
                    <ComboboxClear />
                  </ComboboxInputGroup>
                  <ComboboxContent>
                    <ComboboxEmpty>No leases found.</ComboboxEmpty>
                    <ComboboxList>
                      {(lease: Lease) => (
                        <ComboboxItem key={lease.id} value={lease}>
                          {leaseLabel(lease, contracts, properties, tenants)}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="generate_count">Periods to generate</Label>
                <Input
                  id="generate_count"
                  type="number"
                  min={1}
                  max={24}
                  value={generateCount}
                  onChange={(e) => setGenerateCount(e.target.value)}
                  disabled={billingActionLoading}
                />
                <p className="text-muted-foreground text-xs">
                  Each period picks up exactly where the last one ended — entering 5 generates the
                  lease&apos;s next 5 periods in sequence, not a specific month.
                </p>
              </div>
              <Button type="submit" size="sm" disabled={billingActionLoading || !selectedLease}>
                Generate
              </Button>
            </form>

            <form onSubmit={handleEvaluateOverdue} className="space-y-3">
              <p className="text-xs font-medium text-neutral-500">Check existing record</p>
              <div className="space-y-1.5">
                <Label htmlFor="evaluate_billing_id">Billing record</Label>
                <Combobox
                  items={knownBillingRecords}
                  value={selectedBillingRecord}
                  onValueChange={setSelectedBillingRecord}
                  itemToStringLabel={(record: BillingRecord) =>
                    billingRecordLabel(record, leases, contracts, properties, tenants)
                  }
                  disabled={billingActionLoading}
                >
                  <ComboboxInputGroup>
                    <ComboboxInput
                      id="evaluate_billing_id"
                      placeholder="Search by lease, period, or status…"
                    />
                    <ComboboxClear />
                  </ComboboxInputGroup>
                  <ComboboxContent>
                    <ComboboxEmpty>
                      No billing records checked yet — generate one, or open one from the payment
                      history table below.
                    </ComboboxEmpty>
                    <ComboboxList>
                      {(record: BillingRecord) => (
                        <ComboboxItem key={record.id} value={record}>
                          {billingRecordLabel(record, leases, contracts, properties, tenants)}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={billingActionLoading || !selectedBillingRecord}
              >
                Refresh status
              </Button>
            </form>
          </div>

          {lastBillingRecord && (
            <div className="mt-5 rounded-lg border bg-neutral-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {(() => {
                    const lease = leases.find((l) => l.id === lastBillingRecord.lease_id)
                    return lease
                      ? leaseLabel(lease, contracts, properties, tenants)
                      : "Billing record"
                  })()}
                </span>
                <BillingStatusBadge status={lastBillingRecord.status} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600 sm:grid-cols-4">
                <div>
                  <dt className="text-neutral-400">Period</dt>
                  <dd>
                    {formatDate(lastBillingRecord.period_start)} –{" "}
                    {formatDate(lastBillingRecord.period_end)}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-400">Due date</dt>
                  <dd>{formatDate(lastBillingRecord.due_date)}</dd>
                </div>
                <div>
                  <dt className="text-neutral-400">Amount due</dt>
                  <dd>{lastBillingRecord.amount_due}</dd>
                </div>
                <div>
                  <dt className="text-neutral-400">Balance</dt>
                  <dd>{billingBalance(lastBillingRecord, payments)}</dd>
                </div>
              </dl>
            </div>
          )}

          {selectedLease && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-neutral-500">
                Billing history — {leaseLabel(selectedLease, contracts, properties, tenants)}
              </p>
              {leaseBillingHistoryLoading ? (
                <p className="text-muted-foreground text-xs">Loading…</p>
              ) : leaseBillingHistory.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  No billing records generated yet for this lease.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Due date</TableHead>
                        <TableHead>Amount due</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaseBillingHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-sm">
                            {formatDate(record.period_start)} – {formatDate(record.period_end)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(record.due_date)}
                          </TableCell>
                          <TableCell className="text-sm">{record.amount_due}</TableCell>
                          <TableCell className="text-sm">
                            {billingBalance(record, payments)}
                          </TableCell>
                          <TableCell>
                            <BillingStatusBadge status={record.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payments */}
        <div>
          <h2 className="mb-3 text-sm font-semibold">Payment history</h2>

          {/* Loading skeleton */}
          {fetching && (
            <div className="overflow-hidden rounded-xl border bg-white">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4 border-b px-6 py-4 last:border-0">
                  <div className="h-8 w-8 animate-pulse rounded-lg bg-neutral-100" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-40 animate-pulse rounded bg-neutral-100" />
                    <div className="h-3 w-56 animate-pulse rounded bg-neutral-50" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!fetching && !fetchError && payments.length === 0 && (
            <div className="flex flex-col items-center rounded-xl border bg-white py-16 text-center">
              <p className="text-sm font-medium">No payments yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Record your first payment to get started.
              </p>
            </div>
          )}

          {/* Table */}
          {!fetching && payments.length > 0 && (
            <div className="overflow-hidden rounded-xl border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract</TableHead>
                    <TableHead>Billing record</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid on</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const contract = contractOf(payment.contract_id)
                    const cachedRecord = payment.billing_record_id
                      ? billingRecordCache[payment.billing_record_id]
                      : null
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm font-medium">
                          {contract
                            ? contractLabel(contract, properties, tenants)
                            : payment.contract_id}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {!payment.billing_record_id ? (
                            "—"
                          ) : cachedRecord ? (
                            billingRecordLabel(cachedRecord, leases, contracts, properties, tenants)
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleResolveBillingRecord(payment.billing_record_id!)}
                              disabled={resolvingBillingId === payment.billing_record_id}
                              className="text-foreground underline underline-offset-2 disabled:opacity-50"
                            >
                              {resolvingBillingId === payment.billing_record_id
                                ? "Loading…"
                                : "View details"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{payment.amount}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(payment.paid_at)}
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={payment.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setModal({ type: "receipts", payment })}
                              aria-label={`View receipts for payment ${payment.id}`}
                            >
                              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                                <path
                                  d="M3.5 1.5h6l2.5 2.5v9a1 1 0 01-1 1h-7.5a1 1 0 01-1-1v-10.5a1 1 0 011-1z"
                                  stroke="currentColor"
                                  strokeWidth="1.3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M5 7.5h5M5 9.5h5M5 11.5h3"
                                  stroke="currentColor"
                                  strokeWidth="1.3"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setModal({ type: "edit", payment })}
                              aria-label={`Edit payment ${payment.id}`}
                            >
                              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                                <path
                                  d="M10.5 2.5l2 2-8 8H2.5v-2l8-8z"
                                  stroke="currentColor"
                                  strokeWidth="1.3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setModal({ type: "delete", payment })}
                                className="hover:bg-red-50 hover:text-red-600"
                                aria-label={`Delete payment ${payment.id}`}
                              >
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                                  <path
                                    d="M2.5 4.5h10M6 4.5V3h3v1.5M5.5 4.5v7h4v-7"
                                    stroke="currentColor"
                                    strokeWidth="1.3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="border-t bg-neutral-50 px-6 py-3">
                <p className="text-muted-foreground text-xs">
                  {payments.length} {payments.length === 1 ? "payment" : "payments"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      <Modal
        open={modal.type === "create"}
        onClose={() => setModal({ type: "closed" })}
        title="Record payment"
      >
        <PaymentForm
          contracts={contracts}
          properties={properties}
          tenants={tenants}
          leases={leases}
          billingRecords={knownBillingRecords}
          onSubmit={handleCreate}
          onCancel={() => setModal({ type: "closed" })}
          onError={(message) => showToast(message, "error")}
        />
      </Modal>

      {/* Edit modal */}
      {modal.type === "edit" && (
        <Modal open onClose={() => setModal({ type: "closed" })} title="Edit payment">
          <PaymentForm
            payment={modal.payment}
            contracts={contracts}
            properties={properties}
            tenants={tenants}
            leases={leases}
            billingRecords={knownBillingRecords}
            onSubmit={handleEdit}
            onCancel={() => setModal({ type: "closed" })}
            onError={(message) => showToast(message, "error")}
          />
        </Modal>
      )}

      {/* Receipts */}
      {modal.type === "receipts" && (
        <Modal open onClose={() => setModal({ type: "closed" })} title="Receipts">
          <ReceiptHistory
            payment={modal.payment}
            contractLabel={
              contractOf(modal.payment.contract_id)
                ? contractLabel(contractOf(modal.payment.contract_id)!, properties, tenants)
                : modal.payment.contract_id
            }
            onError={(message) => showToast(message, "error")}
          />
        </Modal>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={modal.type === "delete"}
        onOpenChange={(v) => !v && setModal({ type: "closed" })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete payment</DialogTitle>
          </DialogHeader>
          {modal.type === "delete" && (
            <div className="space-y-5">
              <p className="text-muted-foreground text-sm">
                Are you sure you want to delete this payment? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setModal({ type: "closed" })}
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
