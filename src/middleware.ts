import { NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE } from "@/lib/auth/session"

const PUBLIC_ROUTES = ["/login"]

const IGNORED_PREFIXES = ["/api/", "/_next/", "/favicon.ico"]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (IGNORED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  // No token on a protected route → send to login, preserving destination
  if (!token && !isPublicRoute) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // Already logged in and hitting /login → send to dashboard
  if (token && isPublicRoute) {
    const url = req.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
