/**
 * POST /api/payments/[id]/corrections  — void a payment and replace it with a correction
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendCorrectPayment } from "@/lib/api/paymentsBackend"
import { ApiError } from "@/types"

function unauthorized() {
  return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
}

function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { detail: err.detail, fieldErrors: err.fieldErrors },
      { status: err.status }
    )
  }
  console.error("[api/payments/[id]/corrections] Unexpected error:", err)
  return NextResponse.json({ detail: "An unexpected error occurred" }, { status: 500 })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const payload = await req.json()
    const payment = await backendCorrectPayment(token, id, payload)
    return NextResponse.json(payment, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
