"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"

import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import type { Lease, LeaseCreatePayload, LeaseUpdatePayload } from "@/types/lease"
import type { Contract } from "@/types/contract"
import type { Property } from "@/types/property"
import type { Tenant } from "@/types/tenant"
import { ApiError } from "@/types"
import { leasesApi } from "@/lib/api/leases"
import { contractsApi } from "@/lib/api/contracts"
import { propertiesApi } from "@/lib/api/properties"
import { tenantsApi } from "@/lib/api/tenants"
import Modal from "@/components/ui/Modal"
import { Button } from "@/components/ui/button"
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

import { LeaseForm } from "@/components/ui/LeaseForm"

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; lease: Lease }
  | { type: "delete"; lease: Lease }

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function StatusBadge({ status }: { status: Lease["status"] }) {
  const styles: Record<Lease["status"], string> = {
    ACTIVE: "bg-green-50 text-green-700",
    ENDED: "bg-neutral-100 text-neutral-500",
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

export default function AdminLeasesPage() {
  const { isAdmin, isAtLeastManager, loading: authLoading } = useAuth()
  const router = useRouter()

  const [leases, setLeases] = useState<Lease[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetching, setFetching] = useState(true)
  const [modal, setModal] = useState<ModalState>({ type: "closed" })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      const [leaseList, contractList, propertyList, tenantList] = await Promise.all([
        leasesApi.list(),
        contractsApi.list(),
        propertiesApi.list(),
        tenantsApi.list(),
      ])
      setLeases(leaseList)
      setContracts(contractList)
      setProperties(propertyList)
      setTenants(tenantList)
    } catch (err) {
      setFetchError(err instanceof ApiError ? err.detail : "Failed to load leases")
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading && isAtLeastManager) loadData()
  }, [authLoading, isAtLeastManager, loadData])

  const eligibleContracts = getEligibleContracts(contracts, leases)

  function contractLabel(contractId: string) {
    const contract = contracts.find((c) => c.id === contractId)
    if (!contract) return contractId
    const propertyName =
      properties.find((p) => p.id === contract.property_id)?.name ?? contract.property_id
    const tenantName =
      tenants.find((t) => t.id === contract.tenant_id)?.full_name ?? contract.tenant_id
    return `${propertyName} — ${tenantName}`
  }

  async function handleCreate(payload: LeaseCreatePayload | LeaseUpdatePayload) {
    const created = await leasesApi.create(payload as LeaseCreatePayload)
    setLeases((prev) => [created, ...prev])
    setModal({ type: "closed" })
    showToast("Lease created")
  }

  async function handleEdit(payload: LeaseCreatePayload | LeaseUpdatePayload) {
    if (modal.type !== "edit") return
    const updated = await leasesApi.update(modal.lease.id, payload as LeaseUpdatePayload)
    setLeases((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setModal({ type: "closed" })
    showToast("Lease updated")
  }

  async function handleDelete() {
    if (modal.type !== "delete") return
    setDeleteLoading(true)
    try {
      await leasesApi.delete(modal.lease.id)
      setLeases((prev) => prev.filter((l) => l.id !== modal.lease.id))
      showToast("Lease deleted")
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
              <h1 className="text-xl font-semibold">Leases</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">Manage active lease terms</p>
            </div>
            <Button
              onClick={() => setModal({ type: "create" })}
              disabled={!fetching && eligibleContracts.length === 0}
              title={
                !fetching && eligibleContracts.length === 0
                  ? "No eligible long-term contracts available — create one first"
                  : undefined
              }
              className="bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:opacity-95"
            >
              + Add lease
            </Button>
          </div>
          {!fetching && eligibleContracts.length === 0 && (
            <p className="text-muted-foreground text-xs">
              No eligible long-term contracts available — create one first.
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl space-y-4 px-6 py-6">
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
        {!fetching && !fetchError && leases.length === 0 && (
          <div className="flex flex-col items-center rounded-xl border bg-white py-16 text-center">
            <p className="text-sm font-medium">No leases yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Add your first lease to get started.
            </p>
          </div>
        )}

        {/* Table */}
        {!fetching && leases.length > 0 && (
          <div className="overflow-hidden rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Monthly rent</TableHead>
                  <TableHead>Due day</TableHead>
                  <TableHead>Start date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {leases.map((lease) => (
                  <TableRow key={lease.id}>
                    <TableCell className="text-sm font-medium">
                      {contractLabel(lease.contract_id)}
                    </TableCell>
                    <TableCell className="text-sm">{lease.monthly_rent}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{lease.due_day}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(lease.start_date)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={lease.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setModal({ type: "edit", lease })}
                          aria-label={`Edit lease ${lease.id}`}
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
                            onClick={() => setModal({ type: "delete", lease })}
                            className="hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete lease ${lease.id}`}
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
                ))}
              </TableBody>
            </Table>

            <div className="border-t bg-neutral-50 px-6 py-3">
              <p className="text-muted-foreground text-xs">
                {leases.length} {leases.length === 1 ? "lease" : "leases"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={modal.type === "create"}
        onClose={() => setModal({ type: "closed" })}
        title="Add lease"
      >
        <LeaseForm
          contracts={eligibleContracts}
          properties={properties}
          tenants={tenants}
          onSubmit={handleCreate}
          onCancel={() => setModal({ type: "closed" })}
          onError={(message) => showToast(message, "error")}
        />
      </Modal>

      {/* Edit modal */}
      {modal.type === "edit" && (
        <Modal open onClose={() => setModal({ type: "closed" })} title="Edit lease">
          <LeaseForm
            lease={modal.lease}
            contracts={contracts}
            properties={properties}
            tenants={tenants}
            onSubmit={handleEdit}
            onCancel={() => setModal({ type: "closed" })}
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
            <DialogTitle>Delete lease</DialogTitle>
          </DialogHeader>
          {modal.type === "delete" && (
            <div className="space-y-5">
              <p className="text-muted-foreground text-sm">
                Are you sure you want to delete this lease? This action cannot be undone.
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
