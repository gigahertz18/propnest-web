/**
 * Tests for the ContractForm component.
 *
 * Covers: create mode, edit mode, validation, error display.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ContractForm } from "@/components/ui/ContractForm"
import type { Contract } from "@/types/contract"
import type { Property } from "@/types/property"
import type { Tenant } from "@/types/tenant"

const mockProperties: Property[] = [
  {
    id: "prop-uuid-1",
    name: "Sunset Villa",
    address: "123 Main St, Laguna",
    description: null,
    status: "vacant",
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

const mockContract: Contract = {
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
}

// Types the tenant's name into the searchable combobox and picks the matching
// result — mirrors how a user finds a tenant by name instead of pasting a UUID.
async function selectTenant(tenantName: string) {
  const input = screen.getByLabelText(/tenant/i)
  await userEvent.click(input)
  await userEvent.type(input, tenantName)
  const option = await screen.findByRole("option", { name: tenantName })
  await userEvent.click(option)
}

// ─── Create mode ──────────────────────────────────────────────────────────────

describe("ContractForm — create mode", () => {
  it("renders all required fields", () => {
    render(
      <ContractForm
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByLabelText(/property/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tenant/i)).toBeInTheDocument()
    expect(screen.getByText(/rental type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^rent amount/i)).toBeInTheDocument()
  })

  it("does not show the Status field in create mode", () => {
    render(
      <ContractForm
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.queryByText(/^status$/i)).not.toBeInTheDocument()
  })

  it("filters the tenant list as the user types a name", async () => {
    render(
      <ContractForm
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    const input = screen.getByLabelText(/tenant/i)
    await userEvent.click(input)
    await userEvent.type(input, "Jane")
    expect(await screen.findByRole("option", { name: "Jane Doe" })).toBeInTheDocument()
  })

  it("shows an empty state when no tenant matches the search", async () => {
    render(
      <ContractForm
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    const input = screen.getByLabelText(/tenant/i)
    await userEvent.click(input)
    await userEvent.type(input, "Nonexistent Person")
    expect(await screen.findByText(/no tenants found/i)).toBeInTheDocument()
  })

  it("submit button is disabled when required fields are empty", () => {
    render(
      <ContractForm
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByRole("button", { name: /create contract/i })).toBeDisabled()
  })

  it("submit button enables once all required fields are filled", async () => {
    render(
      <ContractForm
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText(/property/i), { target: { value: "prop-uuid-1" } })
    await selectTenant("Jane Doe")
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2026-01-01" } })
    fireEvent.change(screen.getByLabelText(/^rent amount/i), { target: { value: "15000" } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create contract/i })).not.toBeDisabled()
    })
  })

  it("calls onSubmit with the correct payload", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <ContractForm
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText(/property/i), { target: { value: "prop-uuid-1" } })
    await selectTenant("Jane Doe")
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2026-01-01" } })
    fireEvent.change(screen.getByLabelText(/^rent amount/i), { target: { value: "15000" } })
    fireEvent.click(screen.getByRole("button", { name: /create contract/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          property_id: "prop-uuid-1",
          tenant_id: "tenant-uuid-1",
          start_date: "2026-01-01",
          rent_amount: "15000",
          rental_type: "long_term",
        })
      )
    })
  })

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn()
    render(
      <ContractForm
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
    const onSubmit = jest
      .fn()
      .mockRejectedValue(new Error("Property already has an active contract"))
    const onError = jest.fn()
    render(
      <ContractForm
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
        onError={onError}
      />
    )
    fireEvent.change(screen.getByLabelText(/property/i), { target: { value: "prop-uuid-1" } })
    await selectTenant("Jane Doe")
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2026-01-01" } })
    fireEvent.change(screen.getByLabelText(/^rent amount/i), { target: { value: "15000" } })
    fireEvent.click(screen.getByRole("button", { name: /create contract/i }))
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith("Property already has an active contract")
    })
    expect(screen.queryByText("Property already has an active contract")).not.toBeInTheDocument()
  })

  it("shows the human-readable rental type label, not the raw enum value, in the trigger", () => {
    render(
      <ContractForm
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByText("Long term")).toBeInTheDocument()
    expect(screen.queryByText("long_term")).not.toBeInTheDocument()
  })

  it("re-enables the form after onSubmit throws, so the user can retry", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("Conflict"))
    render(
      <ContractForm
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
        onError={jest.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText(/property/i), { target: { value: "prop-uuid-1" } })
    await selectTenant("Jane Doe")
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2026-01-01" } })
    fireEvent.change(screen.getByLabelText(/^rent amount/i), { target: { value: "15000" } })
    fireEvent.click(screen.getByRole("button", { name: /create contract/i }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create contract/i })).not.toBeDisabled()
    })
  })
})

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe("ContractForm — edit mode", () => {
  it("pre-fills fields from the contract prop", () => {
    render(
      <ContractForm
        contract={mockContract}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByLabelText(/tenant/i)).toHaveValue("Jane Doe")
    expect(screen.getByLabelText(/start date/i)).toHaveValue("2026-01-01")
    expect(screen.getByLabelText(/^rent amount/i)).toHaveValue(15000)
  })

  it("shows the Status field in edit mode", () => {
    render(
      <ContractForm
        contract={mockContract}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByText(/^status$/i)).toBeInTheDocument()
  })

  it("shows the human-readable status label, not the raw enum value, in the trigger", () => {
    render(
      <ContractForm
        contract={mockContract}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(screen.queryByText("ACTIVE")).not.toBeInTheDocument()
  })

  it("sends only the changed fields on submit", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <ContractForm
        contract={mockContract}
        properties={mockProperties}
        tenants={mockTenants}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText(/^rent amount/i), { target: { value: "16000" } })
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ rent_amount: "16000" })
    })
  })
})
