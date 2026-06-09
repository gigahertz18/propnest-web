"use client"

import { useAuth } from "@/context/AuthContext"
import { useState } from "react"

export default function LogoutButton() {
  const { logout } = useAuth()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await logout()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-sm text-[#484848] underline underline-offset-2
                 hover:text-[#222222] disabled:opacity-50 transition-colors"
    >
      {loading ? "Logging out…" : "Log out"}
    </button>
  )
}
