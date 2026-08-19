/**
 * GET    /api/payments/[id]  — get a payment
 * PATCH  /api/payments/[id]  — update a payment
 * DELETE /api/payments/[id]  — delete a payment
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import {
  backendGetPayment,
  backendUpdatePayment,
  backendDeletePayment,
} from "@/lib/api/paymentsBackend"
import { ApiError } from "@/types"

function unauthorized() {
  return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
}

function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.detail }, { status: err.status })
  }
  console.error("[api/payments/[id]] Unexpected error:", err)
  return NextResponse.json({ detail: "An unexpected error occurred" }, { status: 500 })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const payment = await backendGetPayment(token, id)
    return NextResponse.json(payment)
  } catch (err) {
    return handleError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const payload = await req.json()
    const payment = await backendUpdatePayment(token, id, payload)
    return NextResponse.json(payment)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    await backendDeletePayment(token, id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleError(err)
  }
}
