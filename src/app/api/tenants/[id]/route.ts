/**
 * GET    /api/tenants/[id]  — get a tenant
 * PATCH  /api/tenants/[id]  — update a tenant
 * DELETE /api/tenants/[id]  — delete a tenant
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import {
  backendGetTenant,
  backendUpdateTenant,
  backendDeleteTenant,
} from "@/lib/api/tenantsBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const tenant = await backendGetTenant(token, id)
    return NextResponse.json(tenant)
  } catch (err) {
    return handleApiError("api/tenants/[id]", err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const payload = await req.json()
    const tenant = await backendUpdateTenant(token, id, payload)
    return NextResponse.json(tenant)
  } catch (err) {
    return handleApiError("api/tenants/[id]", err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    await backendDeleteTenant(token, id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError("api/tenants/[id]", err)
  }
}
