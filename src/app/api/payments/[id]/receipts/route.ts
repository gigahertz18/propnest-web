/**
 * GET  /api/payments/[id]/receipts  — receipt history for a payment
 * POST /api/payments/[id]/receipts  — issue a receipt (first issuance or
 *                                      reprint; always creates a new record,
 *                                      never mutates an existing one)
 *
 * There is no flat GET /api/v1/receipts/ (list-all) on propnest-api — only
 * per-payment listing — so receipts are scoped under /api/payments/[id],
 * mirroring the existing /api/payments/[id]/corrections sibling route.
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendListReceiptsForPayment, backendIssueReceipt } from "@/lib/api/receiptsBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const receipts = await backendListReceiptsForPayment(token, id)
    return NextResponse.json(receipts)
  } catch (err) {
    return handleApiError("api/payments/[id]/receipts", err)
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const receipt = await backendIssueReceipt(token, id)
    return NextResponse.json(receipt, { status: 201 })
  } catch (err) {
    return handleApiError("api/payments/[id]/receipts", err)
  }
}
