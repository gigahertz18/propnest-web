/**
 * GET /api/receipts/[id]/download  — stream the receipt's PDF file.
 *
 * MinIO is only reachable from propnest-api (see
 * docs/architecture/system-overview.md) — the browser can't fetch the
 * storage URL directly. This route authenticates the request, resolves the
 * receipt's file server-side (receiptsBackend.backendGetReceiptFile), and
 * passes the bytes straight through, so the client never sees the storage
 * URL and only ever talks to our own authenticated same-origin route.
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendGetReceiptFile } from "@/lib/api/receiptsBackend"
import { ApiError } from "@/types"

function unauthorized() {
  return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
}

function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.detail }, { status: err.status })
  }
  console.error("[api/receipts/[id]/download] Unexpected error:", err)
  return NextResponse.json({ detail: "An unexpected error occurred" }, { status: 500 })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const file = await backendGetReceiptFile(token, id)
    return new NextResponse(file.bytes, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
