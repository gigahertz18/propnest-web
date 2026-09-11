/**
 * lib/api/shared/routeResponses.ts
 *
 * Shared response builders for Next.js Route Handlers — currently the
 * error-shaped ones every route.ts used to define locally (`unauthorized`,
 * `handleApiError`), but not limited to error responses; a future non-error
 * response builder common to multiple routes belongs here too.
 */

import { NextResponse } from "next/server"
import { ApiError } from "@/types"

export function unauthorized(): NextResponse {
  return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
}

export function handleApiError(scope: string, err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { detail: err.detail, ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}) },
      { status: err.status }
    )
  }
  console.error(`[${scope}] Unexpected error:`, err)
  return NextResponse.json({ detail: "An unexpected error occurred" }, { status: 500 })
}
