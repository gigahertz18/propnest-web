import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { backendLogin, backendGetMe } from "@/lib/api/backend"
import { AUTH_COOKIE, COOKIE_OPTIONS } from "@/lib/auth/session"
import type { LoginPayload } from "@/types"
import { ApiError } from "@/types"

export async function POST(req: NextRequest) {
  let body: LoginPayload

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ detail: "Invalid request body" }, { status: 400 })
  }

  const { identifier, password } = body

  if (!identifier?.trim() || !password) {
    return NextResponse.json({ detail: "Identifier and password are required" }, { status: 400 })
  }

  try {
    // Step 1: get token from FastAPI
    const { access_token } = await backendLogin({
      identifier: identifier.trim(),
      password,
    })

    // Step 2: fetch the user profile using that token
    const user = await backendGetMe(access_token)

    // Step 3: set httpOnly cookie — token never reaches browser JS
    const response = NextResponse.json(user, { status: 200 })
    response.cookies.set(AUTH_COOKIE, access_token, COOKIE_OPTIONS)

    return response
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ detail: err.detail }, { status: err.status })
    }
    console.error("[auth/login] Unexpected error:", err)
    return NextResponse.json(
      { detail: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}
