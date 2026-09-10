"use client"

import { useAuth } from "@/context/AuthContext"
import { useState } from "react"

export default function LogoutButton() {
  const { logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogout() {
    setLoading(true)
    setError(null)
    try {
      await logout()
    } catch {
      setError("Failed to log out. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleLogout}
        disabled={loading}
        className="text-sm text-[#484848] underline underline-offset-2 transition-colors hover:text-[#222222] disabled:opacity-50"
      >
        {loading ? "Logging out…" : "Log out"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
