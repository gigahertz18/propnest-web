"use client"

import { useState, FormEvent } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { ApiError } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const { login } = useAuth()
  const searchParams = useSearchParams()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword]     = useState("")
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login({ identifier, password })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 401 ? "Invalid username or password." : err.detail
          : "Something went wrong. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center">
          <span className="text-[#FF385C] font-bold text-2xl tracking-tight">
            propnest
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-[22px]">Log in</CardTitle>
            {searchParams.get("next") && (
              <p className="text-sm text-muted-foreground">
                Please log in to continue.
              </p>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              <div className="space-y-1.5">
                <Label htmlFor="identifier">Username or email</Label>
                <Input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#E61E4D] via-[#E31C5F]
                           to-[#D70466] hover:opacity-95"
                disabled={loading || !identifier.trim() || !password}
              >
                {loading ? "Logging in…" : "Log in"}
              </Button>

            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          PropNest Property Management
        </p>
      </div>
    </div>
  )
}
