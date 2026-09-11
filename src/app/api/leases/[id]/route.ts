/**
 * GET    /api/leases/[id]  — get a lease
 * PATCH  /api/leases/[id]  — update a lease
 * DELETE /api/leases/[id]  — delete a lease
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendGetLease, backendUpdateLease, backendDeleteLease } from "@/lib/api/leasesBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const lease = await backendGetLease(token, id)
    return NextResponse.json(lease)
  } catch (err) {
    return handleApiError("api/leases/[id]", err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const payload = await req.json()
    const lease = await backendUpdateLease(token, id, payload)
    return NextResponse.json(lease)
  } catch (err) {
    return handleApiError("api/leases/[id]", err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    await backendDeleteLease(token, id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError("api/leases/[id]", err)
  }
}
