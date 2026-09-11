/**
 * PATCH  /api/users/[id]  — update a user (admin only)
 * DELETE /api/users/[id]  — delete a user (admin only)
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendUpdateUser, backendDeleteUser } from "@/lib/api/usersBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const payload = await req.json()
    const user = await backendUpdateUser(token, id, payload)
    return NextResponse.json(user)
  } catch (err) {
    return handleApiError("api/users/[id]", err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    await backendDeleteUser(token, id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError("api/users/[id]", err)
  }
}
