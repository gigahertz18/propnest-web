/**
 * GET  /api/users  — list all users (admin only)
 * POST /api/users  — create a user (admin only)
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendListUsers, backendCreateUser } from "@/lib/api/usersBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function GET() {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const users = await backendListUsers(token)
    return NextResponse.json(users)
  } catch (err) {
    return handleApiError("api/users", err)
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const payload = await req.json()
    const user = await backendCreateUser(token, payload)
    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    return handleApiError("api/users", err)
  }
}
