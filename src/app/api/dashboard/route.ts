/**
 * GET /api/dashboard — composed landlord dashboard summary
 */

import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendGetDashboardSummary } from "@/lib/api/dashboardBackend"
import { ApiError } from "@/types"

function unauthorized() {
  return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
}

function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.detail }, { status: err.status })
  }
  console.error("[api/dashboard] Unexpected error:", err)
  return NextResponse.json({ detail: "An unexpected error occurred" }, { status: 500 })
}

export async function GET() {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const summary = await backendGetDashboardSummary(token)
    return NextResponse.json(summary)
  } catch (err) {
    return handleError(err)
  }
}
