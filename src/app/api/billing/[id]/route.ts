/**
 * GET /api/billing/[id]  — get a single billing record
 */

import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendGetBillingRecord } from "@/lib/api/billingBackend"
import { ApiError } from "@/types"

function unauthorized() {
  return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
}

function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.detail }, { status: err.status })
  }
  console.error("[api/billing/[id]] Unexpected error:", err)
  return NextResponse.json({ detail: "An unexpected error occurred" }, { status: 500 })
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const billingRecord = await backendGetBillingRecord(token, id)
    return NextResponse.json(billingRecord)
  } catch (err) {
    return handleError(err)
  }
}
