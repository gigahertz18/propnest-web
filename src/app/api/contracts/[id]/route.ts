/**
 * GET    /api/contracts/[id]  — get a contract
 * PATCH  /api/contracts/[id]  — update a contract
 * DELETE /api/contracts/[id]  — delete a contract
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import {
  backendGetContract,
  backendUpdateContract,
  backendDeleteContract,
} from "@/lib/api/contractsBackend"
import { ApiError } from "@/types"

function unauthorized() {
  return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
}

function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.detail }, { status: err.status })
  }
  console.error("[api/contracts/[id]] Unexpected error:", err)
  return NextResponse.json({ detail: "An unexpected error occurred" }, { status: 500 })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const contract = await backendGetContract(token, id)
    return NextResponse.json(contract)
  } catch (err) {
    return handleError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    const payload = await req.json()
    const contract = await backendUpdateContract(token, id, payload)
    return NextResponse.json(contract)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const { id } = await params
    await backendDeleteContract(token, id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleError(err)
  }
}
