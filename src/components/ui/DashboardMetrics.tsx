"use client"

import { useState, useEffect, useCallback } from "react"
import type { DashboardSummary } from "@/types/dashboard"
import { ApiError } from "@/types"
import { dashboardApi } from "@/lib/api/dashboard"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5">
      <p className="text-xs text-[#717171]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#222222]">{value}</p>
    </div>
  )
}

/**
 * Live operational metrics for the dashboard, sourced from propnest-api's
 * single composed aggregation endpoint (GET /dashboard/). There is one
 * endpoint, not six, so this fetches and loads as one unit rather than
 * simulating independent per-metric loading states.
 */
export function DashboardMetrics() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSummary(await dashboardApi.get())
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to load dashboard metrics")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#EBEBEB]" />
        ))}
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5">
        <p className="text-sm text-red-600">{error ?? "Failed to load dashboard metrics"}</p>
        <button
          type="button"
          onClick={load}
          className="mt-2 text-sm text-[#484848] underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="mb-10 space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Collected This Month" value={summary.collected_this_month} />
        <StatCard label="Outstanding" value={summary.outstanding} />
        <StatCard label="Late Payments" value={summary.late_payments.length} />
        <StatCard label="Vacant Units" value={summary.vacant_units} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-[#222222]">Expiring Leases</p>
          {summary.expiring_leases.length === 0 ? (
            <p className="text-sm text-[#717171]">No expiring leases in the lookahead window.</p>
          ) : (
            <ul className="divide-y">
              {summary.expiring_leases.map((lease) => (
                <li key={lease.id} className="py-2 text-sm">
                  <span className="text-[#222222]">Lease {lease.id.slice(0, 8)}</span>
                  <span className="ml-2 text-[#717171]">
                    ends {lease.end_date ? formatDate(lease.end_date) : "—"} · {lease.monthly_rent}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-[#222222]">Recent Payments</p>
          {summary.recent_payments.length === 0 ? (
            <p className="text-sm text-[#717171]">No recent payments.</p>
          ) : (
            <ul className="divide-y">
              {summary.recent_payments.map((payment) => (
                <li key={payment.id} className="py-2 text-sm">
                  <span className="text-[#222222]">{payment.amount}</span>
                  <span className="ml-2 text-[#717171]">
                    {formatDate(payment.paid_at)} · {payment.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
