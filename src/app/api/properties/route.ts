/**
 * GET  /api/properties  — list all properties
 * POST /api/properties  — create a property (admin only)
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendListProperties, backendCreateProperty } from "@/lib/api/propertiesBackend"
import { ApiError } from "@/types"

function unauthorized() {
  return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
}

function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.detail }, { status: err.status })
  }
  console.error("[api/properties] Unexpected error:", err)
  return NextResponse.json({ detail: "An unexpected error occurred" }, { status: 500 })
}

export async function GET() {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const properties = await backendListProperties(token)
    return NextResponse.json(properties)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const payload = await req.json()
    const property = await backendCreateProperty(token, payload)
    return NextResponse.json(property, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
