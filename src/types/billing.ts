// ─── Billing Records ────────────────────────────────────────────────────────

export type BillingRecordStatus = "pending" | "partially_paid" | "paid" | "overdue" | "written_off"

export interface BillingRecord {
  id: string
  lease_id: string
  period_start: string
  period_end: string
  due_date: string
  amount_due: string
  late_fee_applied: boolean
  late_fee_amount_charged: string | null
  status: BillingRecordStatus
  overpaid_amount: string | null
  created_at: string
  updated_at: string
}

export interface BillingRecordGeneratePayload {
  lease_id: string
}
