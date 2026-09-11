/**
 * POST /api/payments/[id]/corrections  — void a payment and replace it with a correction
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendCorrectPayment } from "@/lib/api/paymentsBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const payload = await req.json()
    const payment = await backendCorrectPayment(token, id, payload)
    return NextResponse.json(payment, { status: 201 })
  } catch (err) {
    return handleApiError("api/payments/[id]/corrections", err)
  }
}
