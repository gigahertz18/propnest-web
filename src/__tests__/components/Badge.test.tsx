import { render, screen } from "@testing-library/react"
import { RoleBadge, StatusBadge } from "@/components/ui/Badge"

// ─── RoleBadge ────────────────────────────────────────────────────────────────

describe("RoleBadge", () => {
  it("renders admin role", () => {
    render(<RoleBadge role="admin" />)
    expect(screen.getByText("admin")).toBeInTheDocument()
  })

  it("renders manager role", () => {
    render(<RoleBadge role="manager" />)
    expect(screen.getByText("manager")).toBeInTheDocument()
  })

  it("renders user role", () => {
    render(<RoleBadge role="user" />)
    expect(screen.getByText("user")).toBeInTheDocument()
  })

  it("applies correct color class for admin", () => {
    const { container } = render(<RoleBadge role="admin" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain("bg-[#EEEDFE]")
    expect(badge.className).toContain("text-[#3C3489]")
  })

  it("applies correct color class for manager", () => {
    const { container } = render(<RoleBadge role="manager" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain("bg-[#E1F5EE]")
    expect(badge.className).toContain("text-[#085041]")
  })

  it("applies correct color class for user", () => {
    const { container } = render(<RoleBadge role="user" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain("bg-[#F1EFE8]")
    expect(badge.className).toContain("text-[#444441]")
  })

  it("renders as a span element", () => {
    const { container } = render(<RoleBadge role="admin" />)
    expect(container.firstChild?.nodeName).toBe("SPAN")
  })
})

// ─── StatusBadge ──────────────────────────────────────────────────────────────

describe("StatusBadge", () => {
  it("renders Active when active is true", () => {
    render(<StatusBadge active={true} />)
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("renders Inactive when active is false", () => {
    render(<StatusBadge active={false} />)
    expect(screen.getByText("Inactive")).toBeInTheDocument()
  })

  it("applies green classes when active", () => {
    const { container } = render(<StatusBadge active={true} />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain("bg-[#E1F5EE]")
    expect(badge.className).toContain("text-[#085041]")
  })

  it("applies red classes when inactive", () => {
    const { container } = render(<StatusBadge active={false} />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain("bg-[#FCEBEB]")
    expect(badge.className).toContain("text-[#791F1F]")
  })

  it("renders as a span element", () => {
    const { container } = render(<StatusBadge active={true} />)
    expect(container.firstChild?.nodeName).toBe("SPAN")
  })

  // Edge cases
  it("handles active=false explicitly — not just falsy", () => {
    render(<StatusBadge active={false} />)
    expect(screen.queryByText("Active")).not.toBeInTheDocument()
    expect(screen.getByText("Inactive")).toBeInTheDocument()
  })
})
