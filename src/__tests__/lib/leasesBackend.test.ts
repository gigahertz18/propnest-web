/**
 * Tests for lib/api/leasesBackend.ts
 *
 * Covers the server-side calls to FastAPI lease endpoints. Detail/fieldErrors
 * extraction and timeout behavior are shared by every *Backend.ts module and
 * are covered once in shared/backendFetch.test.ts rather than duplicated here.
 */

import {
  backendListLeases,
  backendGetLease,
  backendCreateLease,
  backendUpdateLease,
  backendDeleteLease,
} from "@/lib/api/leasesBackend"
import type { Lease, LeaseCreatePayload } from "@/types/lease"

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

const createPayload: LeaseCreatePayload = {
  contract_id: "contract-uuid-1",
  monthly_rent: "15000.00",
  due_day: 5,
  start_date: "2026-01-01",
}

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

beforeEach(() => {
  mockFetch.mockReset()
})

describe("leasesBackend CRUD", () => {
  it("backendListLeases unwraps {items,total} into an array and injects the auth header", async () => {
    mockFetch.mockReturnValue(mockResponse({ items: [mockLease], total: 1 }))
    const result = await backendListLeases("my-token")
    expect(result).toEqual([mockLease])
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/leases/"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer my-token" }),
      })
    )
  })

  it("backendGetLease fetches a single lease by id", async () => {
    mockFetch.mockReturnValue(mockResponse(mockLease))
    const result = await backendGetLease("token", "lease-uuid-1")
    expect(result).toEqual(mockLease)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/leases/lease-uuid-1"),
      expect.any(Object)
    )
  })

  it("backendCreateLease POSTs the payload", async () => {
    mockFetch.mockReturnValue(mockResponse(mockLease, 201))
    const result = await backendCreateLease("token", createPayload)
    expect(result).toEqual(mockLease)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/leases/"),
      expect.objectContaining({ method: "POST", body: JSON.stringify(createPayload) })
    )
  })

  it("backendUpdateLease PATCHes the payload", async () => {
    const updated = { ...mockLease, status: "ENDED" as const }
    mockFetch.mockReturnValue(mockResponse(updated))
    const result = await backendUpdateLease("token", "lease-uuid-1", { status: "ENDED" })
    expect(result).toEqual(updated)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/leases/lease-uuid-1"),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "ENDED" }) })
    )
  })

  it("backendDeleteLease resolves without a body on 204", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error("no body")),
      } as Response)
    )
    await expect(backendDeleteLease("token", "lease-uuid-1")).resolves.toBeUndefined()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/leases/lease-uuid-1"),
      expect.objectContaining({ method: "DELETE" })
    )
  })
})
