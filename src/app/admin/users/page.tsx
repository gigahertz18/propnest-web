"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import type { User, UserCreatePayload, UserUpdatePayload} from "@/types";
import { ApiError } from "@/types"
import { usersApi } from "@/lib/api/users"
import Modal from "@/components/ui/Modal"
import UserForm from "@/components/ui/UserForm"
import { RoleBadge, StatusBadge } from "@/components/ui/Badge"
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

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; user: User }
  | { type: "delete"; user: User }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function AdminUsersPage() {
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetching, setFetching] = useState(true)
  const [modal, setModal] = useState<ModalState>({ type: "closed" })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace("/dashboard")
  }, [authLoading, isAdmin, router])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const loadUsers = useCallback(async () => {
    setFetching(true)
    setFetchError(null)
    try {
      setUsers(await usersApi.list())
    } catch (err) {
      setFetchError(err instanceof ApiError ? err.detail : "Failed to load users")
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading && isAdmin) loadUsers()
  }, [authLoading, isAdmin, loadUsers])

  async function handleCreate(payload: UserCreatePayload | UserUpdatePayload) {
    const user = await usersApi.create(payload as UserCreatePayload)
    setUsers((prev) => [user, ...prev])
    setModal({ type: "closed" })
    showToast(`User "${user.username}" created`)
  }

  async function handleEdit(payload: UserCreatePayload | UserUpdatePayload) {
    if (modal.type !== "edit") return
    const updated = await usersApi.update(modal.user.id, payload as UserUpdatePayload)
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    setModal({ type: "closed" })
    showToast(`User "${updated.username}" updated`)
  }

  async function handleDelete() {
    if (modal.type !== "delete") return
    setDeleteLoading(true)
    try {
      await usersApi.delete(modal.user.id)
      setUsers((prev) => prev.filter((u) => u.id !== modal.user.id))
      showToast(`User "${modal.user.username}" deleted`)
      setModal({ type: "closed" })
    } catch (err) {
      showToast(err instanceof ApiError ? err.detail : "Delete failed")
    } finally {
      setDeleteLoading(false)
    }
  }

  if (authLoading || !isAdmin) return null

  return (
    <div className="min-h-screen bg-neutral-50">
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
              <h1 className="text-xl font-semibold">Users</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Manage who has access to PropNest
              </p>
            </div>
            <Button
              onClick={() => setModal({ type: "create" })}
              className="bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] hover:opacity-95"
            >
              + Add user
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
              <button onClick={loadUsers} className="ml-4 underline underline-offset-2">
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
                <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-100" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-32 animate-pulse rounded bg-neutral-100" />
                  <div className="h-3 w-48 animate-pulse rounded bg-neutral-50" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!fetching && !fetchError && users.length === 0 && (
          <div className="flex flex-col items-center rounded-xl border bg-white py-16 text-center">
            <p className="text-sm font-medium">No users yet</p>
            <p className="text-muted-foreground mt-1 text-sm">Add the first user to get started.</p>
          </div>
        )}

        {/* Table */}
        {!fetching && users.length > 0 && (
          <div className="overflow-hidden rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id
                  return (
                    <TableRow key={u.id}>
                      {/* User */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-xs font-semibold text-[#3C3489]">
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {u.full_name}
                              {isSelf && (
                                <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="text-muted-foreground text-xs">@{u.username}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge active={u.is_active} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(u.created_at)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setModal({ type: "edit", user: u })}
                            aria-label={`Edit ${u.username}`}
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
                            onClick={() => !isSelf && setModal({ type: "delete", user: u })}
                            disabled={isSelf}
                            className="hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${u.username}`}
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
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <div className="border-t bg-neutral-50 px-6 py-3">
              <p className="text-muted-foreground text-xs">
                {users.length} {users.length === 1 ? "user" : "users"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={modal.type === "create"}
        onClose={() => setModal({ type: "closed" })}
        title="Add user"
      >
        <UserForm onSubmit={handleCreate} onCancel={() => setModal({ type: "closed" })} />
      </Modal>

      {/* Edit modal */}
      {modal.type === "edit" && (
        <Modal open onClose={() => setModal({ type: "closed" })} title="Edit user">
          <UserForm
            user={modal.user}
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
            <DialogTitle>Delete user</DialogTitle>
          </DialogHeader>
          {modal.type === "delete" && (
            <div className="space-y-5">
              <p className="text-muted-foreground text-sm">
                Are you sure you want to delete{" "}
                <span className="text-foreground font-semibold">{modal.user.full_name}</span>? This
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
