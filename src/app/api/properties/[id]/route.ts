/**
 * PATCH  /api/properties/[id]  — update a property (admin only)
 * DELETE /api/properties/[id]  — delete a property (admin only)
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendUpdateProperty, backendDeleteProperty } from "@/lib/api/propertiesBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const payload = await req.json()
    const property = await backendUpdateProperty(token, id, payload)
    return NextResponse.json(property)
  } catch (err) {
    return handleApiError("api/properties/[id]", err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    await backendDeleteProperty(token, id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError("api/properties/[id]", err)
  }
}
