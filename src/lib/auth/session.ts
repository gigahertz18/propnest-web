/**
 * lib/auth/session.ts
 *
 * Server-side session helpers.
 * Reads and writes the httpOnly auth cookie.
 * Never runs in the browser.
 */

import { cookies } from "next/headers"
import type { CurrentUser } from "@/types"
import { backendGetMe } from "@/lib/api/backend"

export const AUTH_COOKIE = "pn_token"

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60, // 1 hour — matches backend ACCESS_TOKEN_EXPIRE_MINUTES in dev
}

/**
 * Read the auth token from the request cookie store.
 * Returns null if not present.
 */
export async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE)?.value ?? null
}

/**
 * Get the current user by reading the cookie and calling /auth/me.
 * Returns null if no token or token is invalid/expired.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getToken()
  if (!token) return null

  try {
    return await backendGetMe(token)
  } catch {
    return null
  }
}
