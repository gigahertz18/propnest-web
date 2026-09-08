// ─── Payments ───────────────────────────────────────────────────────────────

export type PaymentStatus = "PAID" | "PENDING" | "VOIDED" | "REFUNDED"

// Must stay in lockstep with PAYMENT_METHODS in the backend's
// app/models/payment.py (the DB's ck_payment_method CHECK constraint is
// case-sensitive) — also mirrored by PAYMENT_METHOD_LABELS and
// REFERENCE_NUMBER_FORMATS in components/ui/PaymentForm.tsx.
export type PaymentMethod = "cash" | "bank transfer" | "gcash" | "maya" | "check"

export interface Payment {
  id: string
  contract_id: string
  billing_record_id: string | null
  amount: string
  paid_at: string
  payment_method: PaymentMethod | null
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
  payment_method?: PaymentMethod | null
  status?: PaymentStatus
  reference_number?: string | null
}

export interface PaymentUpdatePayload {
  amount?: string
  paid_at?: string
  payment_method?: PaymentMethod | null
  status?: PaymentStatus
  reference_number?: string | null
}

export interface PaymentCorrectionPayload {
  amount: string
  paid_at: string
  payment_method?: PaymentMethod | null
  status?: PaymentStatus
  reference_number?: string | null
}
