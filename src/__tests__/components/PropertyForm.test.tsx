/**
 * Tests for the PropertyForm component (embedded in admin/properties/page.tsx).
 *
 * Because the form is defined inline in the page file, we re-export it
 * in tests by importing the page and extracting the form via render.
 * Alternatively, extract PropertyForm to its own file and import directly.
 *
 * These tests cover: create mode, edit mode, image upload zone,
 * validation, error display, and edge cases.
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// ── If PropertyForm is extracted to its own file: ─────────────────────────────
// import PropertyForm from "@/components/ui/PropertyForm"
//
// ── If it stays inline, mock the page's dependencies and render the form: ─────
// For this test file we assume PropertyForm has been extracted to:
//   apps/frontend/src/components/ui/PropertyForm.tsx
// which is the recommended refactor once tests are added.

import { PropertyForm } from "@/components/ui/PropertyForm"
import type { Property } from "@/types/property"
import * as propertiesApi from "@/lib/api/properties"

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/api/properties", () => ({
  propertiesApi: {
    listImages: jest.fn(),
    deleteImage: jest.fn(),
    uploadImage: jest.fn(),
  },
}))

/* eslint-disable @next/next/no-img-element */
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))

const mockListImages = propertiesApi.propertiesApi.listImages as jest.MockedFunction<
  typeof propertiesApi.propertiesApi.listImages
>
const mockDeleteImage = propertiesApi.propertiesApi.deleteImage as jest.MockedFunction<
  typeof propertiesApi.propertiesApi.deleteImage
>

const mockProperty: Property = {
  id: "prop-uuid-1",
  name: "Sunset Villa",
  address: "123 Main St, Laguna",
  description: "A lovely villa",
  status: "vacant",
  is_active: true,
  manager_id: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

beforeEach(() => {
  jest.clearAllMocks()
  mockListImages.mockResolvedValue([])
})

// ─── Create mode ──────────────────────────────────────────────────────────────

describe("PropertyForm — create mode", () => {
  it("renders all fields", () => {
    render(<PropertyForm onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByLabelText(/property name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByText(/status/i)).toBeInTheDocument()
    expect(screen.getByText(/photos/i)).toBeInTheDocument()
  })

  it("does not show Active field in create mode", () => {
    render(<PropertyForm onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.queryByText(/^active$/i)).not.toBeInTheDocument()
  })

  it("submit button is disabled when fields are empty", () => {
    render(<PropertyForm onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByRole("button", { name: /create property/i })).toBeDisabled()
  })

  it("submit button enables when name and address are filled", async () => {
    render(<PropertyForm onSubmit={jest.fn()} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: "My Place" } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "1 Road St" } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create property/i })).not.toBeDisabled()
    })
  })

  it("submit button stays disabled when only name is filled", async () => {
    render(<PropertyForm onSubmit={jest.fn()} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: "My Place" } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create property/i })).toBeDisabled()
    })
  })

  it("submit button stays disabled when only address is filled", async () => {
    render(<PropertyForm onSubmit={jest.fn()} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "1 Road St" } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create property/i })).toBeDisabled()
    })
  })

  it("submit button stays disabled when name is only whitespace", async () => {
    render(<PropertyForm onSubmit={jest.fn()} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: "   " } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "1 Road St" } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create property/i })).toBeDisabled()
    })
  })

  it("calls onSubmit with correct payload", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<PropertyForm onSubmit={onSubmit} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: "Beach House" } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "7 Shore Rd" } })
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "By the sea" } })
    fireEvent.click(screen.getByRole("button", { name: /create property/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Beach House",
          address: "7 Shore Rd",
          description: "By the sea",
          status: "vacant",
        }),
        [] // no pending images
      )
    })
  })

  it("defaults status to vacant", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<PropertyForm onSubmit={onSubmit} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: "Place" } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "Addr" } })
    fireEvent.click(screen.getByRole("button", { name: /create property/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ status: "vacant" }),
        expect.any(Array)
      )
    })
  })

  it("sends null description when description is empty", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<PropertyForm onSubmit={onSubmit} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: "Place" } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "Addr" } })
    fireEvent.click(screen.getByRole("button", { name: /create property/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ description: null }),
        expect.any(Array)
      )
    })
  })

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn()
    render(<PropertyForm onSubmit={jest.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it("shows error message when onSubmit throws", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("Server error"))
    render(<PropertyForm onSubmit={onSubmit} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: "Place" } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "Addr" } })
    fireEvent.click(screen.getByRole("button", { name: /create property/i }))
    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument()
    })
  })

  it("disables fields while submitting", async () => {
    let resolveSubmit!: () => void
    const onSubmit = jest.fn(
      () =>
        new Promise<void>((res) => {
          resolveSubmit = res
        })
    )
    render(<PropertyForm onSubmit={onSubmit} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: "Place" } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "Addr" } })
    fireEvent.click(screen.getByRole("button", { name: /create property/i }))
    await waitFor(() => {
      expect(screen.getByLabelText(/property name/i)).toBeDisabled()
    })
    act(() => resolveSubmit())
  })

  it("shows 'Creating…' label while submitting", async () => {
    let resolveSubmit!: () => void
    const onSubmit = jest.fn(
      () =>
        new Promise<void>((res) => {
          resolveSubmit = res
        })
    )
    render(<PropertyForm onSubmit={onSubmit} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: "Place" } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "Addr" } })
    fireEvent.click(screen.getByRole("button", { name: /create property/i }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /creating/i })).toBeInTheDocument()
    })
    act(() => resolveSubmit())
  })
})

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe("PropertyForm — edit mode", () => {
  it("pre-fills all fields from the property prop", async () => {
    render(<PropertyForm property={mockProperty} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByLabelText(/property name/i)).toHaveValue("Sunset Villa")
    expect(screen.getByLabelText(/address/i)).toHaveValue("123 Main St, Laguna")
    expect(screen.getByLabelText(/description/i)).toHaveValue("A lovely villa")
  })

  it("shows the Active field in edit mode", async () => {
    render(<PropertyForm property={mockProperty} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByText(/^active$/i)).toBeInTheDocument()
  })

  it("shows 'Save changes' button label in edit mode", () => {
    render(<PropertyForm property={mockProperty} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument()
  })

  it("only sends changed fields in the patch payload", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<PropertyForm property={mockProperty} onSubmit={onSubmit} onCancel={jest.fn()} />)
    // Change only the name
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: "New Name" } })
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: "New Name" }, [])
    })
  })

  it("sends is_active when toggled to false", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<PropertyForm property={mockProperty} onSubmit={onSubmit} onCancel={jest.fn()} />)
    // Toggle active to false via select
    const activeSelect = screen.getByDisplayValue(/active/i)
    fireEvent.change(activeSelect, { target: { value: "false" } })
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
        expect.any(Array)
      )
    })
  })

  it("sends empty payload when nothing changed", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<PropertyForm property={mockProperty} onSubmit={onSubmit} onCancel={jest.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({}, [])
    })
  })

  it("loads existing images on mount", async () => {
    const images = [{ id: "doc-1", file_url: "https://minio/a.jpg", filename: "a.jpg" }]
    mockListImages.mockResolvedValue(images)
    render(<PropertyForm property={mockProperty} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    await waitFor(() => {
      expect(mockListImages).toHaveBeenCalledWith("prop-uuid-1")
    })
  })

  it("shows 'Saving…' label while submitting", async () => {
    let resolveSubmit!: () => void
    const onSubmit = jest.fn(
      () =>
        new Promise<void>((res) => {
          resolveSubmit = res
        })
    )
    render(<PropertyForm property={mockProperty} onSubmit={onSubmit} onCancel={jest.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /saving/i })).toBeInTheDocument()
    })
    act(() => resolveSubmit())
  })
})

// ─── Image upload zone ────────────────────────────────────────────────────────

describe("PropertyForm — image upload zone", () => {
  it("renders the drop zone", () => {
    render(<PropertyForm onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByText(/drop photos here/i)).toBeInTheDocument()
  })

  it("adds files to pending when selected via file input", async () => {
    render(<PropertyForm onSubmit={jest.fn()} onCancel={jest.fn()} />)
    const input = document.querySelector("input[type='file']") as HTMLInputElement
    const file = new File(["img"], "test.jpg", { type: "image/jpeg" })
    await userEvent.upload(input, file)
    await waitFor(() => {
      expect(screen.getByText(/ready/i)).toBeInTheDocument()
    })
  })

  it("passes pending files to onSubmit", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<PropertyForm onSubmit={onSubmit} onCancel={jest.fn()} />)
    const input = document.querySelector("input[type='file']") as HTMLInputElement
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" })
    await userEvent.upload(input, file)
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: "Place" } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "Addr" } })
    fireEvent.click(screen.getByRole("button", { name: /create property/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.any(Object), [file])
    })
  })

  it("removes pending file when its remove button is clicked", async () => {
    render(<PropertyForm onSubmit={jest.fn()} onCancel={jest.fn()} />)
    const input = document.querySelector("input[type='file']") as HTMLInputElement
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" })
    await userEvent.upload(input, file)
    await waitFor(() => screen.getByText(/ready/i))
    fireEvent.click(screen.getByLabelText(/remove/i))
    await waitFor(() => {
      expect(screen.queryByText(/ready/i)).not.toBeInTheDocument()
    })
  })

  it("calls deleteImage when an existing image is removed in edit mode", async () => {
    const images = [{ id: "doc-1", file_url: "https://minio/a.jpg", filename: "a.jpg" }]
    mockListImages.mockResolvedValue(images)
    mockDeleteImage.mockResolvedValue(undefined)
    render(<PropertyForm property={mockProperty} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    await waitFor(() => screen.getByAltText("a.jpg"))
    fireEvent.click(screen.getByLabelText(/remove/i))
    await waitFor(() => {
      expect(mockDeleteImage).toHaveBeenCalledWith("prop-uuid-1", "doc-1")
    })
  })

  it("silently ignores deleteImage errors without crashing", async () => {
    const images = [{ id: "doc-1", file_url: "https://minio/a.jpg", filename: "a.jpg" }]
    mockListImages.mockResolvedValue(images)
    mockDeleteImage.mockRejectedValue(new Error("Network error"))
    render(<PropertyForm property={mockProperty} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    await waitFor(() => screen.getByAltText("a.jpg"))
    expect(() => fireEvent.click(screen.getByLabelText(/remove/i))).not.toThrow()
  })

  it("does not show image previews when no images are present", () => {
    mockListImages.mockResolvedValue([])
    render(<PropertyForm property={mockProperty} onSubmit={jest.fn()} onCancel={jest.fn()} />)
    expect(document.querySelectorAll("img").length).toBe(0)
  })
})
