// ─── Receipts ───────────────────────────────────────────────────────────────
//
// Receipts are append-only on the backend: there is no update/delete payload
// because a receipt is never mutated once issued. A "reprint" is the same
// POST /payments/{payment_id}/receipts operation as the first issuance — it
// always creates a new Receipt row rather than changing an existing one (see
// ReceiptService.issue_receipt in propnest-api).

export interface Receipt {
  id: string
  receipt_number: number
  payment_id: string
  document_id: string
  created_at: string
  updated_at: string
}
