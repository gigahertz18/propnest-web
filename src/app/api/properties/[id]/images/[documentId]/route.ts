/**
 * DELETE /api/properties/[id]/images/[documentId]
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendDeleteDocument } from "@/lib/api/propertiesBackend"
import { ApiError } from "@/types"

function unauthorized() {
  return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
}

function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.detail }, { status: err.status })
  }
  return NextResponse.json({ detail: "An unexpected error occurred" }, { status: 500 })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { documentId } = await params
    await backendDeleteDocument(token, documentId)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleError(err)
  }
}
