/**
 * GET  /api/properties/[id]/images  — list images for a property
 * POST /api/properties/[id]/images  — upload an image (multipart/form-data)
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendListPropertyImages, backendUploadPropertyImage } from "@/lib/api/propertiesBackend"
import { ApiError } from "@/types"

function unauthorized() {
  return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
}

function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.detail }, { status: err.status })
  }
  console.error("[api/properties/[id]/images] Unexpected error:", err)
  return NextResponse.json({ detail: "An unexpected error occurred" }, { status: 500 })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const images = await backendListPropertyImages(token, id)
    return NextResponse.json(images)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ detail: "No file provided" }, { status: 400 })
    }

    const result = await backendUploadPropertyImage(token, id, file)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
