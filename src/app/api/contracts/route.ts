/**
 * GET  /api/contracts  — list all contracts
 * POST /api/contracts  — create a contract
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendListContracts, backendCreateContract } from "@/lib/api/contractsBackend"
import { ApiError } from "@/types"

function unauthorized() {
  return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
}

function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.detail }, { status: err.status })
  }
  console.error("[api/contracts] Unexpected error:", err)
  return NextResponse.json({ detail: "An unexpected error occurred" }, { status: 500 })
}

export async function GET() {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const contracts = await backendListContracts(token)
    return NextResponse.json(contracts)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const payload = await req.json()
    const contract = await backendCreateContract(token, payload)
    return NextResponse.json(contract, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
