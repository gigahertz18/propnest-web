/**
 * POST /api/billing/generate  — generate the next billing record for a lease
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendGenerateBillingRecord } from "@/lib/api/billingBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function POST(req: NextRequest) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const payload = await req.json()
    const billingRecord = await backendGenerateBillingRecord(token, payload)
    return NextResponse.json(billingRecord, { status: 201 })
  } catch (err) {
    return handleApiError("api/billing/generate", err)
  }
}
