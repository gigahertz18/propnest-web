/**
 * GET  /api/leases  — list all leases
 * POST /api/leases  — create a lease
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendListLeases, backendCreateLease } from "@/lib/api/leasesBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function GET() {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const leases = await backendListLeases(token)
    return NextResponse.json(leases)
  } catch (err) {
    return handleApiError("api/leases", err)
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const payload = await req.json()
    const lease = await backendCreateLease(token, payload)
    return NextResponse.json(lease, { status: 201 })
  } catch (err) {
    return handleApiError("api/leases", err)
  }
}
