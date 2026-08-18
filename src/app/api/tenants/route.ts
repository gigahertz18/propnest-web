/**
 * GET  /api/tenants  — list all tenants
 * POST /api/tenants  — create a tenant
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendListTenants, backendCreateTenant } from "@/lib/api/tenantsBackend"
import { ApiError } from "@/types"

function unauthorized() {
  return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
}

function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.detail }, { status: err.status })
  }
  console.error("[api/tenants] Unexpected error:", err)
  return NextResponse.json({ detail: "An unexpected error occurred" }, { status: 500 })
}

export async function GET() {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const tenants = await backendListTenants(token)
    return NextResponse.json(tenants)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const payload = await req.json()
    const tenant = await backendCreateTenant(token, payload)
    return NextResponse.json(tenant, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
