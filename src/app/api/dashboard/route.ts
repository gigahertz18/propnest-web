/**
 * GET /api/dashboard — composed landlord dashboard summary
 */

import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendGetDashboardSummary } from "@/lib/api/dashboardBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function GET() {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const summary = await backendGetDashboardSummary(token)
    return NextResponse.json(summary)
  } catch (err) {
    return handleApiError("api/dashboard", err)
  }
}
