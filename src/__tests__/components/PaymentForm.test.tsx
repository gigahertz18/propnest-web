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
import { ApiError } from "@/types"
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
  {
    id: "prop-uuid-2",
    name: "Ocean Breeze",
    address: "456 Shore Rd, Batangas",
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
  {
    id: "tenant-uuid-2",
    full_name: "John Smith",
    email: "john@example.com",
    phone_number: "+63 900 000 0001",
    date_of_birth: "1990-01-01",
    current_address: "456 Shore Rd, Batangas",
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
  {
    id: "contract-uuid-2",
    property_id: "prop-uuid-2",
    tenant_id: "tenant-uuid-2",
    rental_type: "long_term",
    start_date: "2026-01-01",
    end_date: null,
    rent_amount: "18000.00",
    deposit: "36000.00",
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
  {
    id: "lease-uuid-2",
    contract_id: "contract-uuid-2",
    monthly_rent: "18000.00",
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
  {
    id: "billing-uuid-2",
    lease_id: "lease-uuid-2",
    period_start: "2026-02-01",
    period_end: "2026-02-28",
    due_date: "2026-02-05",
    amount_due: "18000.00",
    late_fee_applied: false,
    late_fee_amount_charged: null,
    status: "pending",
    overpaid_amount: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
]

const BILLING_RECORD_LABEL = "Sunset Villa — Jane Doe · Jan 1, 2026 – Jan 31, 2026 · pending"
const BILLING_RECORD_LABEL_2 = "Ocean Breeze — John Smith · Feb 1, 2026 – Feb 28, 2026 · pending"

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

// Opens the payment-method select and picks the option with the given label.
async function selectPaymentMethod(label: string) {
  await userEvent.click(screen.getByLabelText(/method/i))
  await userEvent.click(await screen.findByRole("option", { name: label }))
}

// Sets the search value into the searchable contract combobox and picks the
// matching result. Uses paste rather than character-by-character typing since
// these tests aren't exercising incremental filter-as-you-type behavior.
async function selectContract(label: string) {
  const input = screen.getByLabelText(/contract/i)
  await userEvent.click(input)
  await userEvent.clear(input)
  await userEvent.paste(label)
  const option = await screen.findByRole("option", { name: label })
  await userEvent.click(option)
}

// Sets the search value into the searchable billing-record combobox and picks
// the matching result. See selectContract above for why paste is used instead
// of typing character-by-character.
async function selectBillingRecord(label: string) {
  const input = screen.getByLabelText(/billing record/i)
  await userEvent.click(input)
  await userEvent.paste(label)
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
    await selectContract("Sunset Villa — Jane Doe")
    const input = screen.getByLabelText(/billing record/i)
    await userEvent.click(input)
    expect(await screen.findByRole("option", { name: BILLING_RECORD_LABEL })).toBeInTheDocument()
    expect(screen.queryByText("billing-uuid-1")).not.toBeInTheDocument()
  })

  it("only offers billing records belonging to the selected contract's leases", async () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    await selectContract("Sunset Villa — Jane Doe")
    const input = screen.getByLabelText(/billing record/i)
    await userEvent.click(input)
    expect(await screen.findByRole("option", { name: BILLING_RECORD_LABEL })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: BILLING_RECORD_LABEL_2 })).not.toBeInTheDocument()
  })

  it("scopes billing records to whichever contract is selected, not a hardcoded one", async () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    await selectContract("Ocean Breeze — John Smith")
    const input = screen.getByLabelText(/billing record/i)
    await userEvent.click(input)
    expect(await screen.findByRole("option", { name: BILLING_RECORD_LABEL_2 })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: BILLING_RECORD_LABEL })).not.toBeInTheDocument()
  })

  it("offers no billing records before any contract is selected", async () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    const input = screen.getByLabelText(/billing record/i)
    await userEvent.click(input)
    expect(
      await screen.findByText(/no billing records checked yet/i)
    ).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: BILLING_RECORD_LABEL })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: BILLING_RECORD_LABEL_2 })).not.toBeInTheDocument()
  })

  it("submit button is disabled when required fields are empty", () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByRole("button", { name: /record payment/i })).toBeDisabled()
  })

  it("keeps reference number fully optional when payment method is left unspecified", async () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "15000" } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /record payment/i })).not.toBeDisabled()
    })
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
  })

  it("converts the Paid on date to a full ISO datetime in the payload", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<PaymentForm {...baseProps()} onSubmit={onSubmit} onCancel={jest.fn()} />)
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "15000" } })
    fireEvent.change(screen.getByLabelText(/paid on/i), { target: { value: "2026-02-10" } })
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          paid_at: expect.stringMatching(/^2026-02-10T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/),
        })
      )
    })
  })

  it("clears a previously-selected billing record if it no longer belongs to the newly selected contract", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<PaymentForm {...baseProps()} onSubmit={onSubmit} onCancel={jest.fn()} />)
    await selectContract("Sunset Villa — Jane Doe")
    await selectBillingRecord(BILLING_RECORD_LABEL)
    await selectContract("Ocean Breeze — John Smith")
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "18000" } })
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ billing_record_id: null }))
    })
  })

  it("keeps a previously-selected billing record when the contract selection resolves to the same contract", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<PaymentForm {...baseProps()} onSubmit={onSubmit} onCancel={jest.fn()} />)
    await selectContract("Sunset Villa — Jane Doe")
    await selectBillingRecord(BILLING_RECORD_LABEL)
    // Reopen the (already-filled) contract combobox and re-pick the same option,
    // without clearing the input first — unlike selectContract's clear+retype
    // flow, this doesn't transiently deselect the contract along the way.
    const contractInput = screen.getByLabelText(/contract/i)
    await userEvent.click(contractInput)
    await userEvent.click(
      await screen.findByRole("option", { name: "Sunset Villa — Jane Doe" })
    )
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "15000" } })
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ billing_record_id: "billing-uuid-1" })
      )
    })
  })

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

  // Field-specific reference_number 422s are handled separately (see the
  // "renders a reference_number-specific 422 inline" test below) — this
  // covers the generic/non-field error path, which is unchanged by issue #18.
  it("calls onError with the message for a generic onSubmit failure, without rendering it inline", async () => {
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

  it("disables reference number and shows an auto-generated hint when method is cash", async () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    await selectPaymentMethod("Cash")
    expect(screen.getByLabelText(/reference number/i)).toBeDisabled()
    expect(screen.getByText(/auto-generated/i)).toBeInTheDocument()
  })

  it("submits reference_number as null for cash, even if a value was typed before switching to cash", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<PaymentForm {...baseProps()} onSubmit={onSubmit} onCancel={jest.fn()} />)
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "15000" } })
    fireEvent.change(screen.getByLabelText(/reference number/i), { target: { value: "ABC123" } })
    await selectPaymentMethod("Cash")
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ reference_number: null }))
    })
  })

  it("requires check reference numbers to be 4-10 digits", async () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "15000" } })
    await selectPaymentMethod("Check")

    fireEvent.change(screen.getByLabelText(/reference number/i), { target: { value: "12" } })
    fireEvent.blur(screen.getByLabelText(/reference number/i))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /record payment/i })).toBeDisabled()
    })
    expect(screen.getByText(/4–10 digits/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/reference number/i), {
      target: { value: "1234567890" },
    })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /record payment/i })).not.toBeDisabled()
    })
  })

  it("requires gcash reference numbers to be exactly 13 digits", async () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "15000" } })
    await selectPaymentMethod("GCash")

    fireEvent.change(screen.getByLabelText(/reference number/i), {
      target: { value: "123456789012" },
    })
    fireEvent.blur(screen.getByLabelText(/reference number/i))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /record payment/i })).toBeDisabled()
    })
    expect(screen.getByText(/13 digits/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/reference number/i), {
      target: { value: "1234567890123" },
    })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /record payment/i })).not.toBeDisabled()
    })
  })

  it("requires bank transfer / maya reference numbers to be 6-34 alphanumeric+dash characters", async () => {
    render(<PaymentForm {...baseProps()} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "15000" } })
    await selectPaymentMethod("Bank transfer")

    fireEvent.change(screen.getByLabelText(/reference number/i), { target: { value: "ab" } })
    fireEvent.blur(screen.getByLabelText(/reference number/i))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /record payment/i })).toBeDisabled()
    })
    expect(screen.getByText(/letters, numbers, or dashes/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/reference number/i), {
      target: { value: "ABC-123456" },
    })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /record payment/i })).not.toBeDisabled()
    })
  })

  it("renders a reference_number-specific 422 inline instead of calling onError", async () => {
    const onSubmit = jest
      .fn()
      .mockRejectedValue(
        new ApiError(422, "must be 13 digits", { reference_number: "must be 13 digits" })
      )
    const onError = jest.fn()
    render(
      <PaymentForm {...baseProps()} onSubmit={onSubmit} onCancel={jest.fn()} onError={onError} />
    )
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "15000" } })
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }))
    await waitFor(() => {
      expect(screen.getByText("must be 13 digits")).toBeInTheDocument()
    })
    expect(onError).not.toHaveBeenCalled()
  })

  it("clears a server-side reference_number error once the user edits the field", async () => {
    const onSubmit = jest
      .fn()
      .mockRejectedValue(
        new ApiError(422, "must be 13 digits", { reference_number: "must be 13 digits" })
      )
    render(
      <PaymentForm {...baseProps()} onSubmit={onSubmit} onCancel={jest.fn()} onError={jest.fn()} />
    )
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "15000" } })
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }))
    await waitFor(() => {
      expect(screen.getByText("must be 13 digits")).toBeInTheDocument()
    })
    fireEvent.change(screen.getByLabelText(/reference number/i), { target: { value: "x" } })
    expect(screen.queryByText("must be 13 digits")).not.toBeInTheDocument()
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

  it("nulls out reference_number when the method is changed to cash", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <PaymentForm
        {...baseProps()}
        payment={mockPayment}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    )
    await selectPaymentMethod("Cash")
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ payment_method: "cash", reference_number: null })
      )
    })
  })

  it("blocks submit when the user edits an existing reference number into an invalid format", async () => {
    render(
      <PaymentForm
        {...baseProps()}
        payment={mockPayment}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText(/reference number/i), { target: { value: "123" } })
    fireEvent.blur(screen.getByLabelText(/reference number/i))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled()
    })
    expect(screen.getByText(/13 digits/i)).toBeInTheDocument()
  })

  it("shows no validation error on initial render for a pre-filled, already-compliant reference number", () => {
    render(
      <PaymentForm
        {...baseProps()}
        payment={{ ...mockPayment, reference_number: "1234567890123" }}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.queryByText(/must be/i)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /save changes/i })).not.toBeDisabled()
  })

  it("converts a changed Paid on date to a full ISO datetime in the PATCH payload", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <PaymentForm
        {...baseProps()}
        payment={mockPayment}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText(/paid on/i), { target: { value: "2026-03-15" } })
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          paid_at: expect.stringMatching(/^2026-03-15T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/),
        })
      )
    })
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
