/**
 * Tests for the PaymentForm component.
 *
 * Covers: create mode, edit mode, validation, error display, and that every
 * selectable field is presented to the user by human-readable label rather
 * than by raw UUID (contract → property/tenant names, billing record →
 * lease/period/status).
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { PaymentForm } from "@/components/ui/PaymentForm"
import type { Payment } from "@/types/payment"
import type { Contract } from "@/types/contract"
import type { Property } from "@/types/property"
import type { Tenant } from "@/types/tenant"
import type { Lease } from "@/types/lease"
import type { BillingRecord } from "@/types/billing"

const mockProperties: Property[] = [
  {
    id: "prop-uuid-1",
    name: "Sunset Villa",
    address: "123 Main St, Laguna",
    description: null,
    status: "occupied",
    is_active: true,
    manager_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
]

const mockTenants: Tenant[] = [
  {
    id: "tenant-uuid-1",
    full_name: "Jane Doe",
    email: "jane@example.com",
    phone_number: "+63 900 000 0000",
    date_of_birth: "1995-01-01",
    current_address: "123 Main St, Manila",
    occupation: null,
    notes: null,
    is_active: true,
    user_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
]

const mockContracts: Contract[] = [
  {
    id: "contract-uuid-1",
    property_id: "prop-uuid-1",
    tenant_id: "tenant-uuid-1",
    rental_type: "long_term",
    start_date: "2026-01-01",
    end_date: null,
    rent_amount: "15000.00",
    deposit: "30000.00",
    booking_source: "direct",
    status: "ACTIVE",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
]

const mockLeases: Lease[] = [
  {
    id: "lease-uuid-1",
    contract_id: "contract-uuid-1",
    monthly_rent: "15000.00",
    due_day: 5,
    billing_cycle: "monthly",
    security_deposit: null,
    advance_payment: null,
    late_fee_amount: null,
    late_fee_percent: null,
    grace_period_days: 0,
    renewal_option: "none",
    status: "ACTIVE",
    start_date: "2026-01-01",
    end_date: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
]

const mockBillingRecords: BillingRecord[] = [
  {
    id: "billing-uuid-1",
    lease_id: "lease-uuid-1",
    period_start: "2026-01-01",
    period_end: "2026-01-31",
    due_date: "2026-01-05",
    amount_due: "15000.00",
    late_fee_applied: false,
    late_fee_amount_charged: null,
    status: "pending",
    overpaid_amount: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
]

const BILLING_RECORD_LABEL = "Sunset Villa — Jane Doe · Jan 1, 2026 – Jan 31, 2026 · pending"

const mockPayment: Payment = {
  id: "payment-uuid-1",
  contract_id: "contract-uuid-1",
  billing_record_id: "billing-uuid-1",
  amount: "15000.00",
  paid_at: "2026-01-05T00:00:00Z",
  payment_method: "gcash",
  status: "PAID",
  reference_number: "REF-001",
  corrects_payment_id: null,
  created_at: "2026-01-05T00:00:00Z",
  updated_at: "2026-01-05T00:00:00Z",
}

function baseProps() {
  return {
    contracts: mockContracts,
    properties: mockProperties,
    tenants: mockTenants,
    leases: mockLeases,
    billingRecords: mockBillingRecords,
  }
}

// Types into the searchable contract combobox and picks the matching result.
async function selectContract(label: string) {
  const input = screen.getByLabelText(/contract/i)
  await userEvent.click(input)
  await userEvent.type(input, label)
  const option = await screen.findByRole("option", { name: label })
  await userEvent.click(option)
}

// Types into the searchable billing-record combobox and picks the matching result.
async function selectBillingRecord(label: string) {
  const input = screen.getByLabelText(/billing record/i)
  await userEvent.click(input)
  await userEvent.type(input, label)
  const option = await screen.findByRole("option", { name: label })
  await userEvent.click(option)
}

// ─── Create mode ──────────────────────────────────────────────────────────────

describe("PaymentForm — create mode", () => {
  it("renders the required fields", () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByLabelText(/contract/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/billing record/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/reference number/i)).toBeInTheDocument()
  })

  it("does not show the Status field in create mode", () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.queryByText(/^status$/i)).not.toBeInTheDocument()
  })

  it("shows the contract labeled by its property and tenant names, not its raw id", async () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    const input = screen.getByLabelText(/contract/i)
    await userEvent.click(input)
    expect(
      await screen.findByRole("option", { name: "Sunset Villa — Jane Doe" })
    ).toBeInTheDocument()
    expect(screen.queryByText("contract-uuid-1")).not.toBeInTheDocument()
  })

  it("shows known billing records labeled by lease, period, and status, not their raw id", async () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    const input = screen.getByLabelText(/billing record/i)
    await userEvent.click(input)
    expect(await screen.findByRole("option", { name: BILLING_RECORD_LABEL })).toBeInTheDocument()
    expect(screen.queryByText("billing-uuid-1")).not.toBeInTheDocument()
  })

  it("submit button is disabled when required fields are empty", () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByRole("button", { name: /record payment/i })).toBeDisabled()
  })

  it("submit button enables once contract and amount are filled", async () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "15000" } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /record payment/i })).not.toBeDisabled()
    })
  })

  it("calls onSubmit with the correct payload", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<PaymentForm {...baseProps()} onSubmit={onSubmit} onCancel={jest.fn()} />)
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "15000" } })
    await selectBillingRecord(BILLING_RECORD_LABEL)
    fireEvent.change(screen.getByLabelText(/reference number/i), { target: { value: "REF-001" } })
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          contract_id: "contract-uuid-1",
          amount: "15000",
          billing_record_id: "billing-uuid-1",
          reference_number: "REF-001",
        })
      )
    })
  }, 1200000)

  it("omits billing_record_id when left blank", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<PaymentForm {...baseProps()} onSubmit={onSubmit} onCancel={jest.fn()} />)
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "15000" } })
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ billing_record_id: null }))
    })
  })

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn()
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it("calls onError with the message when onSubmit throws, instead of rendering it inline", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("amount must be greater than 0"))
    const onError = jest.fn()
    render(
      <PaymentForm {...baseProps()} onSubmit={onSubmit} onCancel={jest.fn()} onError={onError} />
    )
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "0" } })
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }))
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith("amount must be greater than 0")
    })
    expect(screen.queryByText("amount must be greater than 0")).not.toBeInTheDocument()
  })

  it("re-enables the form after onSubmit throws, so the user can retry", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("Conflict"))
    render(
      <PaymentForm {...baseProps()} onSubmit={onSubmit} onCancel={jest.fn()} onError={jest.fn()} />
    )
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "15000" } })
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /record payment/i })).not.toBeDisabled()
    })
  })
})

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe("PaymentForm — edit mode", () => {
  it("pre-fills fields from the existing payment", () => {
    render(
      <PaymentForm
        {...baseProps()}
        payment={mockPayment}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByLabelText(/amount/i)).toHaveValue(15000)
    expect(screen.getByLabelText(/reference number/i)).toHaveValue("REF-001")
  })

  it("shows the Status field in edit mode", () => {
    render(
      <PaymentForm
        {...baseProps()}
        payment={mockPayment}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByText(/^status$/i)).toBeInTheDocument()
  })

  it("submits only the changed fields", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <PaymentForm
        {...baseProps()}
        payment={mockPayment}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "14000" } })
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ amount: "14000" })
    })
  })
})
