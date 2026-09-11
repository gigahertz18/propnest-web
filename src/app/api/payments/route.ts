/**
 * GET  /api/payments  — list all payments
 * POST /api/payments  — create a payment
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendListPayments, backendCreatePayment } from "@/lib/api/paymentsBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function GET() {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const payments = await backendListPayments(token)
    return NextResponse.json(payments)
  } catch (err) {
    return handleApiError("api/payments", err)
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const payload = await req.json()
    const payment = await backendCreatePayment(token, payload)
    return NextResponse.json(payment, { status: 201 })
  } catch (err) {
    return handleApiError("api/payments", err)
  }
}
