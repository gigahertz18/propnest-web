"use client"

import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"

export default function AdminNav() {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
  }

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between bg-white px-6 py-4"
      style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.08)" }}
    >
      <Link href="/dashboard" className="text-xl font-bold tracking-tight text-[#FF385C]">
        propnest
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-[#484848]">{user.full_name}</span>
            <span className="rounded-full border border-[#DDDDDD] bg-[#F7F7F7] px-2.5 py-1 text-xs text-[#484848] capitalize">
              {user.role}
            </span>
          </>
        )}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-sm text-[#484848] underline underline-offset-2 transition-colors hover:text-[#222222] disabled:opacity-50"
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </header>
  )
}
