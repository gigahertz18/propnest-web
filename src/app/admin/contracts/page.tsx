"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"

import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import type { Contract, ContractCreatePayload, ContractUpdatePayload } from "@/types/contract"
import type { Property } from "@/types/property"
import { ApiError } from "@/types"
import { contractsApi } from "@/lib/api/contracts"
import { propertiesApi } from "@/lib/api/properties"
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

import { ContractForm } from "@/components/ui/ContractForm"

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; contract: Contract }
  | { type: "delete"; contract: Contract }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function StatusBadge({ status }: { status: Contract["status"] }) {
  const styles: Record<Contract["status"], string> = {
    ACTIVE: "bg-green-50 text-green-700",
    EXPIRED: "bg-orange-50 text-orange-700",
    TERMINATED: "bg-neutral-100 text-neutral-500",
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

export default function AdminContractsPage() {
  const { isAdmin, isAtLeastManager, loading: authLoading } = useAuth()
  const router = useRouter()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetching, setFetching] = useState(true)
  const [modal, setModal] = useState<ModalState>({ type: "closed" })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAtLeastManager) router.replace("/dashboard")
  }, [authLoading, isAtLeastManager, router])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = useCallback(async () => {
    setFetching(true)
    setFetchError(null)
    try {
      const [contractList, propertyList] = await Promise.all([
        contractsApi.list(),
        propertiesApi.list(),
      ])
      setContracts(contractList)
      setProperties(propertyList)
    } catch (err) {
      setFetchError(err instanceof ApiError ? err.detail : "Failed to load contracts")
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading && isAtLeastManager) loadData()
  }, [authLoading, isAtLeastManager, loadData])

  function propertyName(propertyId: string) {
    return properties.find((p) => p.id === propertyId)?.name ?? propertyId
  }

  async function handleCreate(payload: ContractCreatePayload | ContractUpdatePayload) {
    const created = await contractsApi.create(payload as ContractCreatePayload)
    setContracts((prev) => [created, ...prev])
    setModal({ type: "closed" })
    showToast("Contract created")
  }

  async function handleEdit(payload: ContractCreatePayload | ContractUpdatePayload) {
    if (modal.type !== "edit") return
    const updated = await contractsApi.update(modal.contract.id, payload as ContractUpdatePayload)
    setContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setModal({ type: "closed" })
    showToast("Contract updated")
  }

  async function handleDelete() {
    if (modal.type !== "delete") return
    setDeleteLoading(true)
    try {
      await contractsApi.delete(modal.contract.id)
      setContracts((prev) => prev.filter((c) => c.id !== modal.contract.id))
      showToast("Contract deleted")
      setModal({ type: "closed" })
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Delete failed")
    } finally {
      setDeleteLoading(false)
    }
  }

  if (authLoading || !isAtLeastManager) return null

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
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
              <h1 className="text-xl font-semibold">Contracts</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Manage rental contracts for your properties
              </p>
            </div>
            <Button
              onClick={() => setModal({ type: "create" })}
              className="bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:opacity-95"
            >
              + Add contract
            </Button>
          </div>
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
        {!fetching && !fetchError && contracts.length === 0 && (
          <div className="flex flex-col items-center rounded-xl border bg-white py-16 text-center">
            <p className="text-sm font-medium">No contracts yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Add your first contract to get started.
            </p>
          </div>
        )}

        {/* Table */}
        {!fetching && contracts.length > 0 && (
          <div className="overflow-hidden rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Rental type</TableHead>
                  <TableHead>Start date</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="text-sm font-medium">
                      {propertyName(contract.property_id)}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {contract.rental_type.replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(contract.start_date)}
                    </TableCell>
                    <TableCell className="text-sm">{contract.rent_amount}</TableCell>
                    <TableCell>
                      <StatusBadge status={contract.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setModal({ type: "edit", contract })}
                          aria-label={`Edit contract ${contract.id}`}
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
                            onClick={() => setModal({ type: "delete", contract })}
                            className="hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete contract ${contract.id}`}
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
                {contracts.length} {contracts.length === 1 ? "contract" : "contracts"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={modal.type === "create"}
        onClose={() => setModal({ type: "closed" })}
        title="Add contract"
      >
        <ContractForm
          properties={properties}
          onSubmit={handleCreate}
          onCancel={() => setModal({ type: "closed" })}
        />
      </Modal>

      {/* Edit modal */}
      {modal.type === "edit" && (
        <Modal open onClose={() => setModal({ type: "closed" })} title="Edit contract">
          <ContractForm
            contract={modal.contract}
            properties={properties}
            onSubmit={handleEdit}
            onCancel={() => setModal({ type: "closed" })}
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
            <DialogTitle>Delete contract</DialogTitle>
          </DialogHeader>
          {modal.type === "delete" && (
            <div className="space-y-5">
              <p className="text-muted-foreground text-sm">
                Are you sure you want to delete this contract? This action cannot be undone.
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
