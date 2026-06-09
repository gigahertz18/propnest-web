"use client"

import { useState, FormEvent } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { ApiError } from "@/types"

export default function LoginPage() {
  const { login } = useAuth()
  const searchParams = useSearchParams()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login({ identifier, password })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? "Invalid username or password."
            : err.detail
        )
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const hasNext = !!searchParams.get("next")

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <span className="text-[#FF385C] font-bold text-2xl tracking-tight">
            propnest
          </span>
        </div>

        {/* Card */}
        <div
          className="border border-[#DDDDDD] rounded-2xl p-8"
          style={{ boxShadow: "0 6px 16px rgba(0,0,0,0.12)" }}
        >
          <h1 className="text-[22px] font-semibold text-[#222222] mb-6">
            Log in
          </h1>

          {hasNext && (
            <p className="text-sm text-[#717171] mb-4">
              Please log in to continue.
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Identifier field */}
            <div
              className="border border-[#DDDDDD] rounded-xl overflow-hidden
                         focus-within:border-[#222222] focus-within:ring-1
                         focus-within:ring-[#222222] transition-all"
            >
              <label
                htmlFor="identifier"
                className="block text-[10px] font-semibold text-[#717171]
                           px-4 pt-3 uppercase tracking-wider"
              >
                Username or email
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 pb-3 pt-1 text-sm text-[#222222]
                           outline-none bg-transparent disabled:opacity-50"
              />
            </div>

            {/* Password field */}
            <div
              className="border border-[#DDDDDD] rounded-xl overflow-hidden
                         focus-within:border-[#222222] focus-within:ring-1
                         focus-within:ring-[#222222] transition-all"
            >
              <label
                htmlFor="password"
                className="block text-[10px] font-semibold text-[#717171]
                           px-4 pt-3 uppercase tracking-wider"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 pb-3 pt-1 text-sm text-[#222222]
                           outline-none bg-transparent disabled:opacity-50"
              />
            </div>

            {/* Error message */}
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password}
              className="w-full text-white font-semibold text-sm py-3.5
                         rounded-xl transition-opacity mt-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:opacity-95 active:opacity-90"
              style={{
                background:
                  "linear-gradient(to right, #E61E4D, #E31C5F, #D70466)",
              }}
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#B0B0B0] mt-6">
          PropNest Property Management
        </p>
      </div>
    </div>
  )
}
