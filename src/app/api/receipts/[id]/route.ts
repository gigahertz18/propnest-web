/**
 * GET /api/receipts/[id]  — get a single receipt
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendGetReceipt } from "@/lib/api/receiptsBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const receipt = await backendGetReceipt(token, id)
    return NextResponse.json(receipt)
  } catch (err) {
    return handleApiError("api/receipts/[id]", err)
  }
}
