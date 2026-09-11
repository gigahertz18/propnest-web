/**
 * GET /api/billing?lease_id=…  — list billing records for a lease
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendListBillingRecords } from "@/lib/api/billingBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function GET(req: NextRequest) {
  const token = await getToken()
  if (!token) return unauthorized()

  const leaseId = req.nextUrl.searchParams.get("lease_id")
  if (!leaseId) {
    return NextResponse.json({ detail: "lease_id is required" }, { status: 400 })
  }

  try {
    const billingRecords = await backendListBillingRecords(token, leaseId)
    return NextResponse.json(billingRecords)
  } catch (err) {
    return handleApiError("api/billing", err)
  }
}
