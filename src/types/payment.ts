// ─── Payments ───────────────────────────────────────────────────────────────

export type PaymentStatus = "PAID" | "PENDING" | "VOIDED" | "REFUNDED"

export interface Payment {
  id: string
  contract_id: string
  billing_record_id: string | null
  amount: string
  paid_at: string
  payment_method: string | null
  status: PaymentStatus
  reference_number: string | null
  corrects_payment_id: string | null
  created_at: string
  updated_at: string
}

export interface PaymentCreatePayload {
  contract_id: string
  billing_record_id?: string | null
  amount: string
  paid_at?: string
  payment_method?: string | null
  status?: PaymentStatus
  reference_number?: string | null
}

export interface PaymentUpdatePayload {
  amount?: string
  paid_at?: string
  payment_method?: string | null
  status?: PaymentStatus
  reference_number?: string | null
}

export interface PaymentCorrectionPayload {
  amount: string
  paid_at: string
  payment_method?: string | null
  status?: PaymentStatus
  reference_number?: string | null
}
