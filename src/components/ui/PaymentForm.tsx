"use client"

import { useState } from "react"
import type {
  Payment,
  PaymentCreatePayload,
  PaymentUpdatePayload,
  PaymentStatus,
} from "@/types/payment"
import type { Contract } from "@/types/contract"
import type { Property } from "@/types/property"
import type { Tenant } from "@/types/tenant"
import type { Lease } from "@/types/lease"
import type { BillingRecord } from "@/types/billing"
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

// ─── Payment Form ───────────────────────────────────────────────────────────

// Single source of truth for enum → label — used for both the select trigger's
// display value and its dropdown options, so they can't drift out of sync.
const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  VOIDED: "Voided",
  REFUNDED: "Refunded",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function contractLabel(contract: Contract, properties: Property[], tenants: Tenant[]) {
  const propertyName =
    properties.find((p) => p.id === contract.property_id)?.name ?? contract.property_id
  const tenantName =
    tenants.find((t) => t.id === contract.tenant_id)?.full_name ?? contract.tenant_id
  return `${propertyName} — ${tenantName}`
}

function leaseLabel(
  lease: Lease,
  contracts: Contract[],
  properties: Property[],
  tenants: Tenant[]
) {
  const contract = contracts.find((c) => c.id === lease.contract_id)
  return contract ? contractLabel(contract, properties, tenants) : lease.id
}

// A billing record has no name of its own — it's identified by whose lease
// it belongs to, which period it covers, and its current status, so that's
// what a user picking one from a list needs to see instead of its raw id.
function billingRecordLabel(
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

interface PaymentFormProps {
  payment?: Payment
  contracts: Contract[]
  properties: Property[]
  tenants: Tenant[]
  leases: Lease[]
  billingRecords: BillingRecord[]
  onSubmit: (payload: PaymentCreatePayload | PaymentUpdatePayload) => Promise<void>
  onCancel: () => void
  onError?: (message: string) => void
}

export function PaymentForm({
  payment,
  contracts,
  properties,
  tenants,
  leases,
  billingRecords,
  onSubmit,
  onCancel,
  onError,
}: PaymentFormProps) {
  const isEdit = !!payment

  const [contractId, setContractId] = useState(payment?.contract_id ?? "")
  const [billingRecordId, setBillingRecordId] = useState(payment?.billing_record_id ?? "")
  const [amount, setAmount] = useState(payment?.amount ?? "")
  const [paidAt, setPaidAt] = useState(payment ? payment.paid_at.slice(0, 10) : "")
  const [paymentMethod, setPaymentMethod] = useState(payment?.payment_method ?? "")
  const [status, setStatus] = useState<PaymentStatus>(payment?.status ?? "PAID")
  const [referenceNumber, setReferenceNumber] = useState(payment?.reference_number ?? "")

  const [loading, setLoading] = useState(false)

  const requiredFilled = isEdit || (contractId.trim() && amount.trim())

  const selectedContract = contracts.find((c) => c.id === contractId) ?? null
  const selectedBillingRecord = billingRecords.find((r) => r.id === billingRecordId) ?? null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        const payload: PaymentUpdatePayload = {}
        if (amount !== payment.amount) payload.amount = amount
        if (paidAt !== payment.paid_at.slice(0, 10)) payload.paid_at = paidAt
        if (paymentMethod !== (payment.payment_method ?? ""))
          payload.payment_method = paymentMethod || null
        if (status !== payment.status) payload.status = status
        if (referenceNumber !== (payment.reference_number ?? ""))
          payload.reference_number = referenceNumber || null
        await onSubmit(payload)
      } else {
        const payload: PaymentCreatePayload = {
          contract_id: contractId,
          billing_record_id: billingRecordId || null,
          amount,
          paid_at: paidAt || undefined,
          payment_method: paymentMethod || null,
          reference_number: referenceNumber || null,
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
      {!isEdit && (
        <div className="space-y-1.5">
          <Label htmlFor="payment_contract_id">Contract</Label>
          <Combobox
            items={contracts}
            value={selectedContract}
            onValueChange={(contract: Contract | null) => setContractId(contract?.id ?? "")}
            itemToStringLabel={(contract: Contract) => contractLabel(contract, properties, tenants)}
            disabled={loading}
          >
            <ComboboxInputGroup>
              <ComboboxInput
                id="payment_contract_id"
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
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="payment_amount">Amount</Label>
          <Input
            id="payment_amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="15000.00"
            disabled={loading}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment_paid_at">Paid on</Label>
          <Input
            id="payment_paid_at"
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {!isEdit && (
        <div className="space-y-1.5">
          <Label htmlFor="payment_billing_record_id">Billing record</Label>
          <Combobox
            items={billingRecords}
            value={selectedBillingRecord}
            onValueChange={(record: BillingRecord | null) => setBillingRecordId(record?.id ?? "")}
            itemToStringLabel={(record: BillingRecord) =>
              billingRecordLabel(record, leases, contracts, properties, tenants)
            }
            disabled={loading}
          >
            <ComboboxInputGroup>
              <ComboboxInput
                id="payment_billing_record_id"
                placeholder="Search by lease, period, or status…"
              />
              <ComboboxClear />
            </ComboboxInputGroup>
            <ComboboxContent>
              <ComboboxEmpty>
                No billing records checked yet — generate or refresh one above first.
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
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="payment_method">Method</Label>
          <Input
            id="payment_method"
            value={paymentMethod ?? ""}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder="gcash, cash, bank transfer…"
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment_reference_number">Reference number</Label>
          <Input
            id="payment_reference_number"
            value={referenceNumber ?? ""}
            onChange={(e) => setReferenceNumber(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {isEdit && (
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as PaymentStatus)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue>{(value: PaymentStatus) => PAYMENT_STATUS_LABELS[value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {PAYMENT_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
              : "Recording…"
            : isEdit
              ? "Save changes"
              : "Record payment"}
        </Button>
      </div>
    </form>
  )
}
