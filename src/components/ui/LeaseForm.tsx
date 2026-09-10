"use client"

import { useState } from "react"
import type {
  Lease,
  LeaseCreatePayload,
  LeaseUpdatePayload,
  BillingCycle,
  RenewalOption,
  LeaseStatus,
} from "@/types/lease"
import type { Contract } from "@/types/contract"
import type { Property } from "@/types/property"
import type { Tenant } from "@/types/tenant"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { contractLabel } from "@/lib/utils"

// ─── Lease Form ─────────────────────────────────────────────────────────────

// Single source of truth for enum → label — used for both the select trigger's
// display value and its dropdown options, so they can't drift out of sync.
const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly",
}

const RENEWAL_OPTION_LABELS: Record<RenewalOption, string> = {
  auto: "Auto-renew",
  manual: "Manual",
  none: "None",
}

const LEASE_STATUS_LABELS: Record<LeaseStatus, string> = {
  ACTIVE: "Active",
  ENDED: "Ended",
}

interface LeaseFormProps {
  lease?: Lease
  contracts: Contract[]
  properties: Property[]
  tenants: Tenant[]
  onSubmit: (payload: LeaseCreatePayload | LeaseUpdatePayload) => Promise<void>
  onCancel: () => void
  onError?: (message: string) => void
}

export function LeaseForm({
  lease,
  contracts,
  properties,
  tenants,
  onSubmit,
  onCancel,
  onError,
}: LeaseFormProps) {
  const isEdit = !!lease

  const [contractId, setContractId] = useState(lease?.contract_id ?? "")
  const [monthlyRent, setMonthlyRent] = useState(lease?.monthly_rent ?? "")
  const [dueDay, setDueDay] = useState(lease ? String(lease.due_day) : "")
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(lease?.billing_cycle ?? "monthly")
  const [securityDeposit, setSecurityDeposit] = useState(lease?.security_deposit ?? "")
  const [advancePayment, setAdvancePayment] = useState(lease?.advance_payment ?? "")
  const [lateFeeAmount, setLateFeeAmount] = useState(lease?.late_fee_amount ?? "")
  const [lateFeePercent, setLateFeePercent] = useState(lease?.late_fee_percent ?? "")
  const [gracePeriodDays, setGracePeriodDays] = useState(
    lease ? String(lease.grace_period_days) : "0"
  )
  const [renewalOption, setRenewalOption] = useState<RenewalOption>(lease?.renewal_option ?? "none")
  const [status, setStatus] = useState<LeaseStatus>(lease?.status ?? "ACTIVE")
  const [startDate, setStartDate] = useState(lease?.start_date ?? "")
  const [endDate, setEndDate] = useState(lease?.end_date ?? "")

  const [loading, setLoading] = useState(false)

  const noEligibleContracts = !isEdit && contracts.length === 0

  const requiredFilled =
    contractId.trim() &&
    monthlyRent.trim() &&
    dueDay !== "" &&
    startDate.trim() &&
    (isEdit || contracts.length > 0)

  const selectedContract = contracts.find((c) => c.id === contractId) ?? null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        const payload: LeaseUpdatePayload = {}
        if (monthlyRent !== lease.monthly_rent) payload.monthly_rent = monthlyRent
        if (Number(dueDay) !== lease.due_day) payload.due_day = Number(dueDay)
        if (billingCycle !== lease.billing_cycle) payload.billing_cycle = billingCycle
        if (securityDeposit !== (lease.security_deposit ?? ""))
          payload.security_deposit = securityDeposit || null
        if (advancePayment !== (lease.advance_payment ?? ""))
          payload.advance_payment = advancePayment || null
        if (lateFeeAmount !== (lease.late_fee_amount ?? ""))
          payload.late_fee_amount = lateFeeAmount || null
        if (lateFeePercent !== (lease.late_fee_percent ?? ""))
          payload.late_fee_percent = lateFeePercent || null
        if (Number(gracePeriodDays) !== lease.grace_period_days)
          payload.grace_period_days = Number(gracePeriodDays)
        if (renewalOption !== lease.renewal_option) payload.renewal_option = renewalOption
        if (status !== lease.status) payload.status = status
        if (startDate !== lease.start_date) payload.start_date = startDate
        if (endDate !== (lease.end_date ?? "")) payload.end_date = endDate || null
        await onSubmit(payload)
      } else {
        const payload: LeaseCreatePayload = {
          contract_id: contractId,
          monthly_rent: monthlyRent,
          due_day: Number(dueDay),
          billing_cycle: billingCycle,
          security_deposit: securityDeposit || null,
          advance_payment: advancePayment || null,
          late_fee_amount: lateFeeAmount || null,
          late_fee_percent: lateFeePercent || null,
          grace_period_days: Number(gracePeriodDays),
          renewal_option: renewalOption,
          start_date: startDate,
          end_date: endDate || null,
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
        <Label htmlFor="lease_contract_id">Contract</Label>
        <Combobox
          items={contracts}
          value={selectedContract}
          onValueChange={(contract: Contract | null) => setContractId(contract?.id ?? "")}
          itemToStringLabel={(contract: Contract) => contractLabel(contract, properties, tenants)}
          disabled={loading || isEdit}
        >
          <ComboboxInputGroup>
            <ComboboxInput
              id="lease_contract_id"
              placeholder="Search contracts by property or tenant…"
              required
            />
            <ComboboxClear />
          </ComboboxInputGroup>
          <ComboboxContent>
            <ComboboxEmpty>No contracts found.</ComboboxEmpty>
            <ComboboxList>
              {(contract: Contract) => (
                <ComboboxItem key={contract.id} value={contract}>
                  {contractLabel(contract, properties, tenants)}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {noEligibleContracts && (
          <Alert variant="destructive">
            <AlertDescription>
              No eligible long-term contracts. Create a long-term Contract without an existing lease
              first.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="lease_monthly_rent">Monthly rent</Label>
          <Input
            id="lease_monthly_rent"
            type="number"
            step="0.01"
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
            placeholder="15000.00"
            disabled={loading}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lease_due_day">Due day</Label>
          <Input
            id="lease_due_day"
            type="number"
            min={1}
            max={31}
            step="1"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Billing cycle</Label>
          <Select
            value={billingCycle}
            onValueChange={(v) => setBillingCycle(v as BillingCycle)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue>{(value: BillingCycle) => BILLING_CYCLE_LABELS[value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(BILLING_CYCLE_LABELS) as BillingCycle[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {BILLING_CYCLE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Renewal option</Label>
          <Select
            value={renewalOption}
            onValueChange={(v) => setRenewalOption(v as RenewalOption)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue>{(value: RenewalOption) => RENEWAL_OPTION_LABELS[value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RENEWAL_OPTION_LABELS) as RenewalOption[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {RENEWAL_OPTION_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isEdit && (
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as LeaseStatus)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue>{(value: LeaseStatus) => LEASE_STATUS_LABELS[value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(LEASE_STATUS_LABELS) as LeaseStatus[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {LEASE_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="lease_start_date">Start date</Label>
          <Input
            id="lease_start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lease_end_date">End date</Label>
          <Input
            id="lease_end_date"
            type="date"
            value={endDate ?? ""}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="lease_security_deposit">Security deposit</Label>
          <Input
            id="lease_security_deposit"
            type="number"
            step="0.01"
            value={securityDeposit ?? ""}
            onChange={(e) => setSecurityDeposit(e.target.value)}
            placeholder="30000.00"
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lease_advance_payment">Advance payment</Label>
          <Input
            id="lease_advance_payment"
            type="number"
            step="0.01"
            value={advancePayment ?? ""}
            onChange={(e) => setAdvancePayment(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="lease_late_fee_amount">Late fee amount</Label>
          <Input
            id="lease_late_fee_amount"
            type="number"
            step="0.01"
            value={lateFeeAmount ?? ""}
            onChange={(e) => setLateFeeAmount(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lease_late_fee_percent">Late fee percent</Label>
          <Input
            id="lease_late_fee_percent"
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={lateFeePercent ?? ""}
            onChange={(e) => setLateFeePercent(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lease_grace_period_days">Grace period (days)</Label>
        <Input
          id="lease_grace_period_days"
          type="number"
          min={0}
          step="1"
          value={gracePeriodDays}
          onChange={(e) => setGracePeriodDays(e.target.value)}
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
          {loading ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save changes" : "Create lease"}
        </Button>
      </div>
    </form>
  )
}
