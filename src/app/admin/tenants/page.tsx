"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"

import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import type { Tenant, TenantCreatePayload, TenantUpdatePayload } from "@/types/tenant"
import { ApiError } from "@/types"
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

import { TenantForm } from "@/components/ui/TenantForm"

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; tenant: Tenant }
  | { type: "delete"; tenant: Tenant }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        isActive ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500",
      ].join(" ")}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminTenantsPage() {
  const { isAdmin, isAtLeastManager, loading: authLoading } = useAuth()
  const router = useRouter()

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
      const tenantList = await tenantsApi.list()
      setTenants(tenantList)
    } catch (err) {
      setFetchError(err instanceof ApiError ? err.detail : "Failed to load tenants")
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading && isAtLeastManager) loadData()
  }, [authLoading, isAtLeastManager, loadData])

  async function handleCreate(payload: TenantCreatePayload | TenantUpdatePayload) {
    const created = await tenantsApi.create(payload as TenantCreatePayload)
    setTenants((prev) => [created, ...prev])
    setModal({ type: "closed" })
    showToast("Tenant created")
  }

  async function handleEdit(payload: TenantCreatePayload | TenantUpdatePayload) {
    if (modal.type !== "edit") return
    const updated = await tenantsApi.update(modal.tenant.id, payload as TenantUpdatePayload)
    setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setModal({ type: "closed" })
    showToast("Tenant updated")
  }

  async function handleDelete() {
    if (modal.type !== "delete") return
    setDeleteLoading(true)
    try {
      await tenantsApi.delete(modal.tenant.id)
      setTenants((prev) => prev.filter((t) => t.id !== modal.tenant.id))
      showToast("Tenant deleted")
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
            // z-[100]: must render above the modal's backdrop-blur overlay (z-50),
            // otherwise the overlay paints on top and blurs the toast underneath it.
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
              <h1 className="text-xl font-semibold">Tenants</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Manage tenant records for your properties
              </p>
            </div>
            <Button
              onClick={() => setModal({ type: "create" })}
              className="bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:opacity-95"
            >
              + Add tenant
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
        {!fetching && !fetchError && tenants.length === 0 && (
          <div className="flex flex-col items-center rounded-xl border bg-white py-16 text-center">
            <p className="text-sm font-medium">No tenants yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Add your first tenant to get started.
            </p>
          </div>
        )}

        {/* Table */}
        {!fetching && tenants.length > 0 && (
          <div className="overflow-hidden rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="text-sm font-medium">{tenant.full_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{tenant.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {tenant.phone_number}
                    </TableCell>
                    <TableCell>
                      <StatusBadge isActive={tenant.is_active} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setModal({ type: "edit", tenant })}
                          aria-label={`Edit tenant ${tenant.id}`}
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
                            onClick={() => setModal({ type: "delete", tenant })}
                            className="hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete tenant ${tenant.id}`}
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
                {tenants.length} {tenants.length === 1 ? "tenant" : "tenants"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={modal.type === "create"}
        onClose={() => setModal({ type: "closed" })}
        title="Add tenant"
      >
        <TenantForm
          onSubmit={handleCreate}
          onCancel={() => setModal({ type: "closed" })}
          onError={(message) => showToast(message, "error")}
        />
      </Modal>

      {/* Edit modal */}
      {modal.type === "edit" && (
        <Modal open onClose={() => setModal({ type: "closed" })} title="Edit tenant">
          <TenantForm
            tenant={modal.tenant}
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
            <DialogTitle>Delete tenant</DialogTitle>
          </DialogHeader>
          {modal.type === "delete" && (
            <div className="space-y-5">
              <p className="text-muted-foreground text-sm">
                Are you sure you want to delete this tenant? This action cannot be undone.
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
