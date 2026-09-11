/**
 * GET /api/billing/[id]  — get a single billing record
 */

import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendGetBillingRecord } from "@/lib/api/billingBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const billingRecord = await backendGetBillingRecord(token, id)
    return NextResponse.json(billingRecord)
  } catch (err) {
    return handleApiError("api/billing/[id]", err)
  }
}
