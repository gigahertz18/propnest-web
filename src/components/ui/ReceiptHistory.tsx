"use client"

import { useState, useEffect, useCallback } from "react"
import type { Receipt } from "@/types/receipt"
import type { Payment } from "@/types/payment"
import { ApiError } from "@/types"
import { receiptsApi } from "@/lib/api/receipts"
import { Button } from "@/components/ui/button"

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

type View = { type: "list" } | { type: "detail"; receipt: Receipt }

interface ReceiptHistoryProps {
  payment: Payment
  contractLabel: string
  onError: (message: string) => void
}

/**
 * Receipt history + detail for a single payment, shown inside the
 * modal-based admin UI convention used across the app.
 *
 * Issuing and reprinting are the same call (receiptsApi.issue) — the
 * backend always appends a new record and never mutates an existing one,
 * so "reprint" here is just "issue again," and the original stays in the
 * list untouched.
 */
export function ReceiptHistory({ payment, contractLabel, onError }: ReceiptHistoryProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [issuing, setIssuing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [view, setView] = useState<View>({ type: "list" })

  const load = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const list = await receiptsApi.listForPayment(payment.id)
      setReceipts([...list].sort((a, b) => b.receipt_number - a.receipt_number))
    } catch (err) {
      setFetchError(err instanceof ApiError ? err.detail : "Failed to load receipts")
    } finally {
      setLoading(false)
    }
  }, [payment.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function handleDownload(receipt: Receipt) {
    setDownloading(true)
    try {
      const { blob, filename } = await receiptsApi.download(receipt.id, receipt.receipt_number)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      onError(err instanceof ApiError ? err.detail : "Failed to download receipt")
    } finally {
      setDownloading(false)
    }
  }

  async function handleIssue() {
    setIssuing(true)
    try {
      const receipt = await receiptsApi.issue(payment.id)
      setReceipts((prev) => [receipt, ...prev])
    } catch (err) {
      onError(err instanceof ApiError ? err.detail : "Failed to issue receipt")
    } finally {
      setIssuing(false)
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading receipts…</p>
  }

  if (fetchError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{fetchError}</p>
        <Button variant="outline" onClick={load}>
          Retry
        </Button>
      </div>
    )
  }

  if (view.type === "detail") {
    const receipt = view.receipt
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setView({ type: "list" })}
          className="text-muted-foreground text-sm underline underline-offset-2"
        >
          ← Back to receipt history
        </button>

        <div className="space-y-1 rounded-lg border p-4 text-sm">
          <p className="font-medium">Receipt #{receipt.receipt_number}</p>
          <p className="text-muted-foreground">{contractLabel}</p>
          <p className="text-muted-foreground">Payment amount: {payment.amount}</p>
          <p className="text-muted-foreground">Paid on {formatDate(payment.paid_at)}</p>
          <p className="text-muted-foreground">Issued {formatDateTime(receipt.created_at)}</p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleDownload(receipt)}
          disabled={downloading}
        >
          {downloading ? "Downloading…" : "Download PDF"}
        </Button>

        <div className="space-y-2">
          <Button onClick={handleIssue} disabled={issuing} className="w-full">
            {issuing ? "Reprinting…" : "Reprint receipt"}
          </Button>
          <p className="text-muted-foreground text-xs">
            Reprinting issues a new receipt record — it never changes or removes this one.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {receipts.length === 0 ? (
        <p className="text-muted-foreground text-sm">No receipts issued yet for this payment.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {receipts.map((receipt) => (
            <li key={receipt.id}>
              <button
                type="button"
                onClick={() => setView({ type: "detail", receipt })}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50"
              >
                <div>
                  <p className="text-sm font-medium">Receipt #{receipt.receipt_number}</p>
                  <p className="text-muted-foreground text-xs">
                    Issued {formatDateTime(receipt.created_at)}
                  </p>
                </div>
                <span className="text-muted-foreground text-xs">View →</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button onClick={handleIssue} disabled={issuing} className="w-full">
        {issuing ? "Issuing…" : "Issue receipt"}
      </Button>
    </div>
  )
}
