/**
 * Tests for the TenantForm component.
 *
 * Covers: create mode, edit mode, validation, error display.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import { TenantForm } from "@/components/ui/TenantForm"
import type { Tenant } from "@/types/tenant"

const mockTenant: Tenant = {
  id: "tenant-uuid-1",
  full_name: "Jane Doe",
  email: "jane@example.com",
  phone_number: "+63 900 000 0000",
  date_of_birth: "1995-01-01",
  current_address: "123 Main St, Manila",
  occupation: "Software Engineer",
  notes: null,
  is_active: true,
  user_id: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

// ─── Create mode ──────────────────────────────────────────────────────────────

describe("TenantForm — create mode", () => {
  it("renders all required fields", () => {
    render(<TenantForm onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/current address/i)).toBeInTheDocument()
  })

  it("does not show the Status field in create mode", () => {
    render(<TenantForm onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.queryByText(/^status$/i)).not.toBeInTheDocument()
  })

  it("submit button is disabled when required fields are empty", () => {
    render(<TenantForm onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByRole("button", { name: /create tenant/i })).toBeDisabled()
  })

  it("submit button enables once all required fields are filled", async () => {
    render(<TenantForm onSubmit={jest.fn()} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Jane Doe" } })
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "jane@example.com" } })
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: "+63 900 000 0000" },
    })
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: "1995-01-01" } })
    fireEvent.change(screen.getByLabelText(/current address/i), {
      target: { value: "123 Main St, Manila" },
    })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create tenant/i })).not.toBeDisabled()
    })
  })

  it("calls onSubmit with the correct payload", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<TenantForm onSubmit={onSubmit} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Jane Doe" } })
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "jane@example.com" } })
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: "+63 900 000 0000" },
    })
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: "1995-01-01" } })
    fireEvent.change(screen.getByLabelText(/current address/i), {
      target: { value: "123 Main St, Manila" },
    })
    fireEvent.click(screen.getByRole("button", { name: /create tenant/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: "Jane Doe",
          email: "jane@example.com",
          phone_number: "+63 900 000 0000",
          date_of_birth: "1995-01-01",
          current_address: "123 Main St, Manila",
        })
      )
    })
  })

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn()
    render(<TenantForm onSubmit={jest.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it("calls onError with the message when onSubmit throws, instead of rendering it inline", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("Tenant with this email already exists"))
    const onError = jest.fn()
    render(<TenantForm onSubmit={onSubmit} onCancel={jest.fn()} onError={onError} />)
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Jane Doe" } })
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "jane@example.com" } })
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: "+63 900 000 0000" },
    })
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: "1995-01-01" } })
    fireEvent.change(screen.getByLabelText(/current address/i), {
      target: { value: "123 Main St, Manila" },
    })
    fireEvent.click(screen.getByRole("button", { name: /create tenant/i }))
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith("Tenant with this email already exists")
    })
    expect(screen.queryByText("Tenant with this email already exists")).not.toBeInTheDocument()
  })

  it("re-enables the form after onSubmit throws, so the user can retry", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("Conflict"))
    render(<TenantForm onSubmit={onSubmit} onCancel={jest.fn()} onError={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Jane Doe" } })
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "jane@example.com" } })
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: "+63 900 000 0000" },
    })
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: "1995-01-01" } })
    fireEvent.change(screen.getByLabelText(/current address/i), {
      target: { value: "123 Main St, Manila" },
    })
    fireEvent.click(screen.getByRole("button", { name: /create tenant/i }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create tenant/i })).not.toBeDisabled()
    })
  })
})

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe("TenantForm — edit mode", () => {
  it("pre-fills fields from the tenant prop", () => {
    render(<TenantForm tenant={mockTenant} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Jane Doe")
    expect(screen.getByLabelText(/^email/i)).toHaveValue("jane@example.com")
    expect(screen.getByLabelText(/date of birth/i)).toHaveValue("1995-01-01")
  })

  it("shows the Status field in edit mode", () => {
    render(<TenantForm tenant={mockTenant} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByText(/^status$/i)).toBeInTheDocument()
  })

  it("shows the human-readable status label, not the raw boolean, in the trigger", () => {
    render(<TenantForm tenant={mockTenant} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(screen.queryByText("true")).not.toBeInTheDocument()
  })

  it("sends only the changed fields on submit", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<TenantForm tenant={mockTenant} onSubmit={onSubmit} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: "+63 900 111 1111" },
    })
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ phone_number: "+63 900 111 1111" })
    })
  })
})
