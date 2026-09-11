/**
 * DELETE /api/properties/[id]/images/[documentId]
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendDeleteDocument } from "@/lib/api/propertiesBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

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
    return handleApiError("api/properties/[id]/images/[documentId]", err)
  }
}
