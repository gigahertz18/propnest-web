/**
 * Tests for the LeaseForm component.
 *
 * Covers: create mode, edit mode, validation, the eligible-contract empty
 * state, and error display.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { LeaseForm } from "@/components/ui/LeaseForm"
import type { Lease } from "@/types/lease"
import type { Contract } from "@/types/contract"
import type { Property } from "@/types/property"
import type { Tenant } from "@/types/tenant"

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

const mockLease: Lease = {
  id: "lease-uuid-1",
  contract_id: "contract-uuid-1",
  monthly_rent: "15000.00",
  due_day: 5,
  billing_cycle: "monthly",
  security_deposit: "30000.00",
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
}

// Sets the search value into the searchable contract combobox and picks the
// matching result. Uses paste rather than character-by-character typing since
// these tests aren't exercising incremental filter-as-you-type behavior.
async function selectContract(label: string) {
  const input = screen.getByLabelText(/contract/i)
  await userEvent.click(input)
  await userEvent.paste(label)
  const option = await screen.findByRole("option", { name: label })
  await userEvent.click(option)
}

// ─── Create mode ──────────────────────────────────────────────────────────────

describe("LeaseForm — create mode", () => {
  it("renders all required fields", () => {
    render(
      <LeaseForm
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByLabelText(/contract/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/monthly rent/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/due day/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    expect(screen.getByText(/renewal option/i)).toBeInTheDocument()
  })

  it("does not show the Status field in create mode", () => {
    render(
      <LeaseForm
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.queryByText(/^status$/i)).not.toBeInTheDocument()
  })

  it("shows the contract labeled by its property and tenant names", async () => {
    render(
      <LeaseForm
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    const input = screen.getByLabelText(/contract/i)
    await userEvent.click(input)
    expect(
      await screen.findByRole("option", { name: "Sunset Villa — Jane Doe" })
    ).toBeInTheDocument()
  })

  it("submit button is disabled when required fields are empty", () => {
    render(
      <LeaseForm
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByRole("button", { name: /create lease/i })).toBeDisabled()
  })

  it("submit button enables once all required fields are filled", async () => {
    render(
      <LeaseForm
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/monthly rent/i), { target: { value: "15000" } })
    fireEvent.change(screen.getByLabelText(/due day/i), { target: { value: "5" } })
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2026-01-01" } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create lease/i })).not.toBeDisabled()
    })
  })

  it("calls onSubmit with the correct payload", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LeaseForm
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    )
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/monthly rent/i), { target: { value: "15000" } })
    fireEvent.change(screen.getByLabelText(/due day/i), { target: { value: "5" } })
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2026-01-01" } })
    fireEvent.click(screen.getByRole("button", { name: /create lease/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          contract_id: "contract-uuid-1",
          monthly_rent: "15000",
          due_day: 5,
          start_date: "2026-01-01",
        })
      )
    })
  })

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn()
    render(
      <LeaseForm
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it("calls onError with the message when onSubmit throws, instead of rendering it inline", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("Contract already has a lease"))
    const onError = jest.fn()
    render(
      <LeaseForm
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
        onError={onError}
      />
    )
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/monthly rent/i), { target: { value: "15000" } })
    fireEvent.change(screen.getByLabelText(/due day/i), { target: { value: "5" } })
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2026-01-01" } })
    fireEvent.click(screen.getByRole("button", { name: /create lease/i }))
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith("Contract already has a lease")
    })
    expect(screen.queryByText("Contract already has a lease")).not.toBeInTheDocument()
  })

  it("re-enables the form after onSubmit throws, so the user can retry", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("Conflict"))
    render(
      <LeaseForm
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
        onError={jest.fn()}
      />
    )
    await selectContract("Sunset Villa — Jane Doe")
    fireEvent.change(screen.getByLabelText(/monthly rent/i), { target: { value: "15000" } })
    fireEvent.change(screen.getByLabelText(/due day/i), { target: { value: "5" } })
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2026-01-01" } })
    fireEvent.click(screen.getByRole("button", { name: /create lease/i }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create lease/i })).not.toBeDisabled()
    })
  })

  it("shows an alert and disables submit when there are no eligible contracts", () => {
    render(
      <LeaseForm
        contracts={[]}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByText(/no eligible long-term contracts/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /create lease/i })).toBeDisabled()
  })
})

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe("LeaseForm — edit mode", () => {
  it("pre-fills fields from the lease prop", () => {
    render(
      <LeaseForm
        lease={mockLease}
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByLabelText(/contract/i)).toHaveValue("Sunset Villa — Jane Doe")
    expect(screen.getByLabelText(/monthly rent/i)).toHaveValue(15000)
    expect(screen.getByLabelText(/due day/i)).toHaveValue(5)
    expect(screen.getByLabelText(/start date/i)).toHaveValue("2026-01-01")
  })

  it("shows the Status field in edit mode", () => {
    render(
      <LeaseForm
        lease={mockLease}
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByText(/^status$/i)).toBeInTheDocument()
  })

  it("disables the contract field in edit mode", () => {
    render(
      <LeaseForm
        lease={mockLease}
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByLabelText(/contract/i)).toBeDisabled()
  })

  it("sends only the changed fields on submit, and never contract_id", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LeaseForm
        lease={mockLease}
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText(/monthly rent/i), { target: { value: "16000" } })
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ monthly_rent: "16000" })
    })
  })

  it("allows editing even when the contracts prop is empty (the lease's own contract needn't be eligible)", () => {
    render(
      <LeaseForm
        lease={mockLease}
        contracts={[]}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByRole("button", { name: /save changes/i })).not.toBeDisabled()
  })
})

// ─── Range validation ─────────────────────────────────────────────────────────

async function fillOtherRequiredFields() {
  await selectContract("Sunset Villa — Jane Doe")
  fireEvent.change(screen.getByLabelText(/monthly rent/i), { target: { value: "15000" } })
  fireEvent.change(screen.getByLabelText(/due day/i), { target: { value: "5" } })
  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2026-01-01" } })
}

describe("LeaseForm — range validation", () => {
  it("rejects an out-of-range due day client-side and does not call onSubmit", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LeaseForm
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    )
    await fillOtherRequiredFields()
    const dueDay = screen.getByLabelText(/due day/i)

    fireEvent.change(dueDay, { target: { value: "32" } })
    fireEvent.blur(dueDay)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create lease/i })).toBeDisabled()
    })
    expect(screen.getByText(/must be between 1 and 31/i)).toBeInTheDocument()

    fireEvent.change(dueDay, { target: { value: "0" } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create lease/i })).toBeDisabled()
    })

    fireEvent.change(dueDay, { target: { value: "15" } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create lease/i })).not.toBeDisabled()
    })

    fireEvent.click(screen.getByRole("button", { name: /create lease/i }))
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalledWith(expect.objectContaining({ due_day: 32 }))
    })
  })

  it("rejects an out-of-range late fee percent client-side", async () => {
    render(
      <LeaseForm
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    await fillOtherRequiredFields()
    const lateFeePercent = screen.getByLabelText(/late fee percent/i)

    fireEvent.change(lateFeePercent, { target: { value: "101" } })
    fireEvent.blur(lateFeePercent)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create lease/i })).toBeDisabled()
    })
    expect(screen.getByText(/must be between 0 and 100/i)).toBeInTheDocument()

    fireEvent.change(lateFeePercent, { target: { value: "-1" } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create lease/i })).toBeDisabled()
    })

    fireEvent.change(lateFeePercent, { target: { value: "10" } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create lease/i })).not.toBeDisabled()
    })
  })

  it("rejects a negative grace period client-side", async () => {
    render(
      <LeaseForm
        contracts={mockContracts}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    await fillOtherRequiredFields()
    const gracePeriod = screen.getByLabelText(/grace period/i)

    fireEvent.change(gracePeriod, { target: { value: "-1" } })
    fireEvent.blur(gracePeriod)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create lease/i })).toBeDisabled()
    })
    expect(screen.getByText(/must be 0 or greater/i)).toBeInTheDocument()

    fireEvent.change(gracePeriod, { target: { value: "0" } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create lease/i })).not.toBeDisabled()
    })
  })
})
