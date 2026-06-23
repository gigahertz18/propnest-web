"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Rehydrate session state on mount by reading the cookie via server route
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

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
      router.push("/dashboard")
      router.refresh()
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
