"use client"

import { useState, FormEvent } from "react"
import { User, UserCreatePayload, UserUpdatePayload, UserRole } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface UserFormProps {
  user?: User
  onSubmit: (data: UserCreatePayload | UserUpdatePayload) => Promise<void>
  onCancel: () => void
}

const ROLES: UserRole[] = ["admin", "manager", "user"]

export default function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const isEdit = !!user

  const [fullName, setFullName] = useState(user?.full_name ?? "")
  const [username, setUsername] = useState(user?.username ?? "")
  const [email, setEmail]       = useState(user?.email ?? "")
  const [password, setPassword] = useState("")
  const [role, setRole]         = useState<UserRole>(user?.role ?? "user")
  const [isActive, setIsActive] = useState(user?.is_active ?? true)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isEdit) {
        const payload: UserUpdatePayload = {}
        if (fullName !== user.full_name) payload.full_name = fullName
        if (username !== user.username)   payload.username  = username
        if (email    !== user.email)      payload.email     = email
        if (role     !== user.role)       payload.role      = role
        if (isActive !== user.is_active)  payload.is_active = isActive
        if (password)                     payload.password  = password
        await onSubmit(payload)
      } else {
        await onSubmit({ full_name: fullName, username, email, password, role, is_active: isActive })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const isSubmitDisabled =
    loading || !fullName || !username || !email || (!isEdit && !password)

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Smith"
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="janesmith"
          disabled={loading}
          autoComplete="off"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">
          {isEdit ? "New password" : "Password"}
          {isEdit && (
            <span className="ml-1 text-muted-foreground font-normal text-xs">
              (leave blank to keep current)
            </span>
          )}
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isEdit ? "Leave blank to keep current" : "Min. 8 characters"}
          disabled={loading}
          autoComplete="new-password"
          required={!isEdit}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select
            value={role}
            onValueChange={(v) => setRole(v as UserRole)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r} className="capitalize">
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={isActive ? "active" : "inactive"}
            onValueChange={(v) => setIsActive(v === "active")}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F]
                     to-[#D70466] hover:opacity-95"
          disabled={isSubmitDisabled}
        >
          {loading
            ? isEdit ? "Saving…" : "Creating…"
            : isEdit ? "Save changes" : "Create user"}
        </Button>
      </div>

    </form>
  )
}
