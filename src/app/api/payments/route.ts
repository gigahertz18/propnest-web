/**
 * GET  /api/payments  — list all payments
 * POST /api/payments  — create a payment
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendListPayments, backendCreatePayment } from "@/lib/api/paymentsBackend"
import { ApiError } from "@/types"

function unauthorized() {
  return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
}

function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.detail }, { status: err.status })
  }
  console.error("[api/payments] Unexpected error:", err)
  return NextResponse.json({ detail: "An unexpected error occurred" }, { status: 500 })
}

export async function GET() {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const payments = await backendListPayments(token)
    return NextResponse.json(payments)
  } catch (err) {
    return handleError(err)
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
    return handleError(err)
  }
}
