/**
 * Tests for the ContractForm component.
 *
 * Covers: create mode, edit mode, validation, error display.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import { ContractForm } from "@/components/ui/ContractForm"
import type { Contract } from "@/types/contract"
import type { Property } from "@/types/property"

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

// ─── Create mode ──────────────────────────────────────────────────────────────

describe("ContractForm — create mode", () => {
  it("renders all required fields", () => {
    render(<ContractForm properties={mockProperties} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByLabelText(/property/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tenant id/i)).toBeInTheDocument()
    expect(screen.getByText(/rental type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^rent amount/i)).toBeInTheDocument()
  })

  it("does not show the Status field in create mode", () => {
    render(<ContractForm properties={mockProperties} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.queryByText(/^status$/i)).not.toBeInTheDocument()
  })

  it("submit button is disabled when required fields are empty", () => {
    render(<ContractForm properties={mockProperties} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByRole("button", { name: /create contract/i })).toBeDisabled()
  })

  it("submit button enables once all required fields are filled", async () => {
    render(<ContractForm properties={mockProperties} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/property/i), { target: { value: "prop-uuid-1" } })
    fireEvent.change(screen.getByLabelText(/tenant id/i), { target: { value: "tenant-uuid-1" } })
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2026-01-01" } })
    fireEvent.change(screen.getByLabelText(/^rent amount/i), { target: { value: "15000" } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create contract/i })).not.toBeDisabled()
    })
  })

  it("calls onSubmit with the correct payload", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<ContractForm properties={mockProperties} onSubmit={onSubmit} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/property/i), { target: { value: "prop-uuid-1" } })
    fireEvent.change(screen.getByLabelText(/tenant id/i), { target: { value: "tenant-uuid-1" } })
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
    render(<ContractForm properties={mockProperties} onSubmit={jest.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it("shows an error message when onSubmit throws", async () => {
    const onSubmit = jest
      .fn()
      .mockRejectedValue(new Error("Property already has an active contract"))
    render(<ContractForm properties={mockProperties} onSubmit={onSubmit} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/property/i), { target: { value: "prop-uuid-1" } })
    fireEvent.change(screen.getByLabelText(/tenant id/i), { target: { value: "tenant-uuid-1" } })
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2026-01-01" } })
    fireEvent.change(screen.getByLabelText(/^rent amount/i), { target: { value: "15000" } })
    fireEvent.click(screen.getByRole("button", { name: /create contract/i }))
    await waitFor(() => {
      expect(screen.getByText("Property already has an active contract")).toBeInTheDocument()
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
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByLabelText(/tenant id/i)).toHaveValue("tenant-uuid-1")
    expect(screen.getByLabelText(/start date/i)).toHaveValue("2026-01-01")
    expect(screen.getByLabelText(/^rent amount/i)).toHaveValue(15000)
  })

  it("shows the Status field in edit mode", () => {
    render(
      <ContractForm
        contract={mockContract}
        properties={mockProperties}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByText(/^status$/i)).toBeInTheDocument()
  })

  it("sends only the changed fields on submit", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <ContractForm
        contract={mockContract}
        properties={mockProperties}
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
