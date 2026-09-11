/**
 * @jest-environment node
 *
 * Tests for lib/api/shared/routeResponses.ts
 *
 * Covers the shared response builders for Route Handlers: `handleApiError`
 * (replaces every route.ts's former local `handleError`) and `unauthorized`
 * (replaces every route.ts's former local `unauthorized`).
 */

import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"
import { ApiError } from "@/types"

beforeEach(() => {
  jest.restoreAllMocks()
})

describe("handleApiError", () => {
  it("returns the ApiError's status and detail", async () => {
    const res = handleApiError("api/contracts", new ApiError(404, "Contract not found"))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ detail: "Contract not found" })
  })

  it("includes fieldErrors when the ApiError has them", async () => {
    const res = handleApiError(
      "api/contracts",
      new ApiError(422, "must be greater than 0", { rent_amount: "must be greater than 0" })
    )
    expect(await res.json()).toEqual({
      detail: "must be greater than 0",
      fieldErrors: { rent_amount: "must be greater than 0" },
    })
  })

  it("omits fieldErrors entirely when the ApiError doesn't have any", async () => {
    const res = handleApiError("api/contracts", new ApiError(404, "Contract not found"))
    expect(await res.json()).not.toHaveProperty("fieldErrors")
  })

  it("returns a generic 500 and logs the scope for a non-ApiError value", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    const res = handleApiError("api/contracts", new Error("Database connection lost"))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ detail: "An unexpected error occurred" })
    expect(errorSpy).toHaveBeenCalledWith("[api/contracts] Unexpected error:", expect.any(Error))
  })
})

describe("unauthorized", () => {
  it("returns a 401 with a not-authenticated detail", async () => {
    const res = unauthorized()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ detail: "Not authenticated" })
  })
})
