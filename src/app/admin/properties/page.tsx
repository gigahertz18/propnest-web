"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"

import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import type {
  Property,
  PropertyCreatePayload,
  PropertyUpdatePayload,
  PropertyStatus,
} from "@/types/property"
import { ApiError } from "@/types"
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

import { PropertyForm } from "@/components/ui/PropertyForm"

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; property: Property }
  | { type: "delete"; property: Property }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function StatusBadge({ status }: { status: PropertyStatus }) {
  const isOccupied = status === "occupied"
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        isOccupied ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700",
      ].join(" ")}
    >
      <span
        className={["h-1.5 w-1.5 rounded-full", isOccupied ? "bg-green-600" : "bg-orange-500"].join(
          " "
        )}
      />
      {isOccupied ? "Occupied" : "Vacant"}
    </span>
  )
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        active ? "bg-[#EEEDFE] text-[#3C3489]" : "bg-neutral-100 text-neutral-400",
      ].join(" ")}
    >
      {active ? "Active" : "Inactive"}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPropertiesPage() {
  const { isAdmin, isAtLeastManager, loading: authLoading } = useAuth()
  const router = useRouter()

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

  const loadProperties = useCallback(async () => {
    setFetching(true)
    setFetchError(null)
    try {
      setProperties(await propertiesApi.list())
    } catch (err) {
      setFetchError(err instanceof ApiError ? err.detail : "Failed to load properties")
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading && isAtLeastManager) loadProperties()
  }, [authLoading, isAtLeastManager, loadProperties])

  async function uploadPendingImages(propertyId: string, files: File[]) {
    for (const file of files) {
      try {
        await propertiesApi.uploadImage(propertyId, file)
      } catch {
        showToast(`Warning: could not upload "${file.name}"`)
      }
    }
  }

  async function handleCreate(
    payload: PropertyCreatePayload | PropertyUpdatePayload,
    pendingImages: File[]
  ) {
    const created = await propertiesApi.create(payload as PropertyCreatePayload)
    if (pendingImages.length) await uploadPendingImages(created.id, pendingImages)
    setProperties((prev) => [created, ...prev])
    setModal({ type: "closed" })
    showToast(`"${created.name}" added`)
  }

  async function handleEdit(
    payload: PropertyCreatePayload | PropertyUpdatePayload,
    pendingImages: File[]
  ) {
    if (modal.type !== "edit") return
    const patch = payload as PropertyUpdatePayload
    const updated = await propertiesApi.update(modal.property.id, patch)
    if (pendingImages.length) await uploadPendingImages(updated.id, pendingImages)
    // Merge patch into response to guard against backends missing optional fields
    const merged: Property = { ...modal.property, ...updated, ...patch }
    setProperties((prev) => prev.map((p) => (p.id === merged.id ? merged : p)))
    setModal({ type: "closed" })
    showToast(`"${merged.name}" updated`)
  }

  async function handleDelete() {
    if (modal.type !== "delete") return
    setDeleteLoading(true)
    try {
      await propertiesApi.delete(modal.property.id)
      setProperties((prev) => prev.filter((p) => p.id !== modal.property.id))
      showToast(`"${modal.property.name}" deleted`)
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
              <h1 className="text-xl font-semibold">Properties</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">Manage your property listings</p>
            </div>
            {isAdmin && (
              <Button
                onClick={() => setModal({ type: "create" })}
                className="bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:opacity-95"
              >
                + Add property
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl space-y-4 px-6 py-6">
        {fetchError && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              {fetchError}
              <button onClick={loadProperties} className="ml-4 underline underline-offset-2">
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
        {!fetching && !fetchError && properties.length === 0 && (
          <div className="flex flex-col items-center rounded-xl border bg-white py-16 text-center">
            <p className="text-sm font-medium">No properties yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {isAdmin
                ? "Add your first property to get started."
                : "Properties will appear here once added."}
            </p>
          </div>
        )}

        {/* Table */}
        {!fetching && properties.length > 0 && (
          <div className="overflow-hidden rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Added</TableHead>
                  {isAdmin && <TableHead className="w-[80px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF0F3] text-[#E31C5F]">
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                            <path
                              d="M1.5 7.5L7.5 2l6 5.5V14H9.5v-3.5h-4V14H1.5V7.5z"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{property.name}</p>
                          {property.description && (
                            <p className="text-muted-foreground max-w-[220px] truncate text-xs">
                              {property.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{property.address}</TableCell>
                    <TableCell>
                      <StatusBadge status={property.status} />
                    </TableCell>
                    <TableCell>
                      <ActiveBadge active={property.is_active} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(property.created_at)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setModal({ type: "edit", property })}
                            aria-label={`Edit ${property.name}`}
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setModal({ type: "delete", property })}
                            className="hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${property.name}`}
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
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="border-t bg-neutral-50 px-6 py-3">
              <p className="text-muted-foreground text-xs">
                {properties.length} {properties.length === 1 ? "property" : "properties"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={modal.type === "create"}
        onClose={() => setModal({ type: "closed" })}
        title="Add property"
      >
        <PropertyForm onSubmit={handleCreate} onCancel={() => setModal({ type: "closed" })} />
      </Modal>

      {/* Edit modal */}
      {modal.type === "edit" && (
        <Modal open onClose={() => setModal({ type: "closed" })} title="Edit property">
          <PropertyForm
            property={modal.property}
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
            <DialogTitle>Delete property</DialogTitle>
          </DialogHeader>
          {modal.type === "delete" && (
            <div className="space-y-5">
              <p className="text-muted-foreground text-sm">
                Are you sure you want to delete{" "}
                <span className="text-foreground font-semibold">{modal.property.name}</span>? This
                action cannot be undone.
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
