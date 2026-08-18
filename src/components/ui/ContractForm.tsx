"use client"

import { useState } from "react"
import type {
  Contract,
  ContractCreatePayload,
  ContractUpdatePayload,
  RentalType,
  ContractStatus,
} from "@/types/contract"
import type { Property } from "@/types/property"
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
import { Button } from "@/components/ui/button"

// ─── Contract Form ─────────────────────────────────────────────────────────────

interface ContractFormProps {
  contract?: Contract
  properties: Property[]
  onSubmit: (payload: ContractCreatePayload | ContractUpdatePayload) => Promise<void>
  onCancel: () => void
}

export function ContractForm({ contract, properties, onSubmit, onCancel }: ContractFormProps) {
  const isEdit = !!contract

  const [propertyId, setPropertyId] = useState(contract?.property_id ?? "")
  const [tenantId, setTenantId] = useState(contract?.tenant_id ?? "")
  const [rentalType, setRentalType] = useState<RentalType>(contract?.rental_type ?? "long_term")
  const [startDate, setStartDate] = useState(contract?.start_date ?? "")
  const [endDate, setEndDate] = useState(contract?.end_date ?? "")
  const [rentAmount, setRentAmount] = useState(contract?.rent_amount ?? "")
  const [deposit, setDeposit] = useState(contract?.deposit ?? "")
  const [bookingSource, setBookingSource] = useState(contract?.booking_source ?? "direct")
  const [status, setStatus] = useState<ContractStatus>(contract?.status ?? "ACTIVE")

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const requiredFilled =
    propertyId.trim() && tenantId.trim() && startDate.trim() && rentAmount.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isEdit) {
        const payload: ContractUpdatePayload = {}
        if (rentalType !== contract.rental_type) payload.rental_type = rentalType
        if (startDate !== contract.start_date) payload.start_date = startDate
        if (endDate !== (contract.end_date ?? "")) payload.end_date = endDate || null
        if (rentAmount !== contract.rent_amount) payload.rent_amount = rentAmount
        if (deposit !== (contract.deposit ?? "")) payload.deposit = deposit || null
        if (bookingSource !== contract.booking_source) payload.booking_source = bookingSource
        if (status !== contract.status) payload.status = status
        await onSubmit(payload)
      } else {
        const payload: ContractCreatePayload = {
          property_id: propertyId,
          tenant_id: tenantId,
          rental_type: rentalType,
          start_date: startDate,
          end_date: endDate || null,
          rent_amount: rentAmount,
          deposit: deposit || null,
          booking_source: bookingSource,
        }
        await onSubmit(payload)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="contract_property_id">Property</Label>
        <select
          id="contract_property_id"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          disabled={loading || isEdit}
          required
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select a property…</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contract_tenant_id">Tenant ID</Label>
        <Input
          id="contract_tenant_id"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          placeholder="Tenant UUID"
          disabled={loading}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Rental type</Label>
          <Select
            value={rentalType}
            onValueChange={(v) => setRentalType(v as RentalType)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="long_term">Long term</SelectItem>
              <SelectItem value="short_term">Short term</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isEdit && (
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ContractStatus)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="contract_start_date">Start date</Label>
          <Input
            id="contract_start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contract_end_date">End date</Label>
          <Input
            id="contract_end_date"
            type="date"
            value={endDate ?? ""}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="contract_rent_amount">Rent amount</Label>
          <Input
            id="contract_rent_amount"
            type="number"
            step="0.01"
            value={rentAmount}
            onChange={(e) => setRentAmount(e.target.value)}
            placeholder="15000.00"
            disabled={loading}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contract_deposit">Deposit</Label>
          <Input
            id="contract_deposit"
            type="number"
            step="0.01"
            value={deposit ?? ""}
            onChange={(e) => setDeposit(e.target.value)}
            placeholder="30000.00"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contract_booking_source">Booking source</Label>
        <Input
          id="contract_booking_source"
          value={bookingSource}
          onChange={(e) => setBookingSource(e.target.value)}
          placeholder="direct"
          disabled={loading}
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
          {loading
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save changes"
              : "Create contract"}
        </Button>
      </div>
    </form>
  )
}
