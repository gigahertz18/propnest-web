"use client"

import { useState } from "react"
import type { Tenant, TenantCreatePayload, TenantUpdatePayload } from "@/types/tenant"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// ─── Tenant Form ────────────────────────────────────────────────────────────

type ActiveStatus = "active" | "inactive"

const ACTIVE_STATUS_LABELS: Record<ActiveStatus, string> = {
  active: "Active",
  inactive: "Inactive",
}

interface TenantFormProps {
  tenant?: Tenant
  onSubmit: (payload: TenantCreatePayload | TenantUpdatePayload) => Promise<void>
  onCancel: () => void
  onError?: (message: string) => void
}

export function TenantForm({ tenant, onSubmit, onCancel, onError }: TenantFormProps) {
  const isEdit = !!tenant

  const [fullName, setFullName] = useState(tenant?.full_name ?? "")
  const [email, setEmail] = useState(tenant?.email ?? "")
  const [phoneNumber, setPhoneNumber] = useState(tenant?.phone_number ?? "")
  const [dateOfBirth, setDateOfBirth] = useState(tenant?.date_of_birth ?? "")
  const [currentAddress, setCurrentAddress] = useState(tenant?.current_address ?? "")
  const [occupation, setOccupation] = useState(tenant?.occupation ?? "")
  const [notes, setNotes] = useState(tenant?.notes ?? "")
  const [isActive, setIsActive] = useState<ActiveStatus>(
    (tenant?.is_active ?? true) ? "active" : "inactive"
  )

  const [loading, setLoading] = useState(false)

  const requiredFilled =
    fullName.trim() &&
    email.trim() &&
    phoneNumber.trim() &&
    dateOfBirth.trim() &&
    currentAddress.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        const payload: TenantUpdatePayload = {}
        if (fullName !== tenant.full_name) payload.full_name = fullName
        if (email !== tenant.email) payload.email = email
        if (phoneNumber !== tenant.phone_number) payload.phone_number = phoneNumber
        if (dateOfBirth !== tenant.date_of_birth) payload.date_of_birth = dateOfBirth
        if (currentAddress !== tenant.current_address) payload.current_address = currentAddress
        if (occupation !== (tenant.occupation ?? "")) payload.occupation = occupation || null
        if (notes !== (tenant.notes ?? "")) payload.notes = notes || null
        const activeBool = isActive === "active"
        if (activeBool !== tenant.is_active) payload.is_active = activeBool
        await onSubmit(payload)
      } else {
        const payload: TenantCreatePayload = {
          full_name: fullName,
          email,
          phone_number: phoneNumber,
          date_of_birth: dateOfBirth,
          current_address: currentAddress,
          occupation: occupation || null,
          notes: notes || null,
        }
        await onSubmit(payload)
      }
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="tenant_full_name">Full name</Label>
        <Input
          id="tenant_full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
          disabled={loading}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tenant_email">Email</Label>
          <Input
            id="tenant_email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            disabled={loading}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tenant_phone_number">Phone number</Label>
          <Input
            id="tenant_phone_number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+63 900 000 0000"
            disabled={loading}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tenant_date_of_birth">Date of birth</Label>
          <Input
            id="tenant_date_of_birth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        {isEdit && (
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={isActive}
              onValueChange={(v) => setIsActive(v as ActiveStatus)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue>{(value: ActiveStatus) => ACTIVE_STATUS_LABELS[value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ACTIVE_STATUS_LABELS) as ActiveStatus[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {ACTIVE_STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tenant_current_address">Current address</Label>
        <Input
          id="tenant_current_address"
          value={currentAddress}
          onChange={(e) => setCurrentAddress(e.target.value)}
          placeholder="123 Main St, Manila"
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tenant_occupation">Occupation</Label>
        <Input
          id="tenant_occupation"
          value={occupation ?? ""}
          onChange={(e) => setOccupation(e.target.value)}
          placeholder="Software Engineer"
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tenant_notes">Notes</Label>
        <textarea
          id="tenant_notes"
          value={notes ?? ""}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes"
          disabled={loading}
          rows={3}
          className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !requiredFilled}
          className="bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-white hover:opacity-95"
        >
          {loading ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save changes" : "Create tenant"}
        </Button>
      </div>
    </form>
  )
}
