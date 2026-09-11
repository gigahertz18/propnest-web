/**
 * POST /api/billing/[id]/evaluate-overdue  — re-evaluate a billing record's overdue status
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendEvaluateOverdue } from "@/lib/api/billingBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const asOf = req.nextUrl.searchParams.get("as_of") ?? undefined
    const billingRecord = await backendEvaluateOverdue(token, id, asOf)
    return NextResponse.json(billingRecord)
  } catch (err) {
    return handleApiError("api/billing/[id]/evaluate-overdue", err)
  }
}
