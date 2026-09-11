/**
 * GET  /api/contracts  — list all contracts
 * POST /api/contracts  — create a contract
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "@/lib/auth/session"
import { backendListContracts, backendCreateContract } from "@/lib/api/contractsBackend"
import { handleApiError, unauthorized } from "@/lib/api/shared/routeResponses"

export async function GET() {
  const token = await getToken()
  if (!token) return unauthorized()

  try {
    const contracts = await backendListContracts(token)
    return NextResponse.json(contracts)
  } catch (err) {
    return handleApiError("api/contracts", err)
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
    return handleApiError("api/contracts", err)
  }
}
