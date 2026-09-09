"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { CurrentUser, LoginPayload } from "@/types"
import { ApiError } from "@/types"

interface AuthContextValue {
  user: CurrentUser | null
  loading: boolean
  isAdmin: boolean
  isManager: boolean
  isAtLeastManager: boolean
  isRegularUser: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode
  initialUser: CurrentUser | null
}) {
  // The root layout already resolves the current user server-side (from the
  // httpOnly cookie) on every full navigation, so there's no need for a
  // client-side rehydration fetch on mount — that would just duplicate the
  // same /auth/me call the server already made for this request.
  const [user, setUser] = useState<CurrentUser | null>(initialUser)
  // Always resolved by the time this renders — kept in the context shape
  // since consumers gate effects on it (e.g. admin pages waiting for auth
  // state before fetching their own data).
  const loading = false
  const router = useRouter()

  const login = useCallback(
    async (payload: LoginPayload) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new ApiError(res.status, data.detail ?? "Login failed")
      }

      setUser(data as CurrentUser)
      // /dashboard hasn't been rendered yet this session, so push alone
      // triggers a fresh server render (which will see the new auth
      // cookie) — no need for a follow-up refresh() of the same route.
      router.push("/dashboard")
    },
    [router]
  )

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    router.push("/login")
    router.refresh()
  }, [router])

  const isAdmin = user?.role === "admin"
  const isManager = user?.role === "manager"
  const isAtLeastManager = isAdmin || isManager
  const isRegularUser = user?.role === "user"

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isManager,
        isAtLeastManager,
        isRegularUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
