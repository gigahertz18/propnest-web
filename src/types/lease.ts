// ─── Leases ───────────────────────────────────────────────────────────────────

export type BillingCycle = "monthly"

export type RenewalOption = "auto" | "manual" | "none"

export type LeaseStatus = "ACTIVE" | "ENDED"

export interface Lease {
  id: string
  contract_id: string
  monthly_rent: string
  due_day: number
  billing_cycle: BillingCycle
  security_deposit: string | null
  advance_payment: string | null
  late_fee_amount: string | null
  late_fee_percent: string | null
  grace_period_days: number
  renewal_option: RenewalOption
  status: LeaseStatus
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface LeaseCreatePayload {
  contract_id: string
  monthly_rent: string
  due_day: number
  billing_cycle?: BillingCycle
  security_deposit?: string | null
  advance_payment?: string | null
  late_fee_amount?: string | null
  late_fee_percent?: string | null
  grace_period_days?: number
  renewal_option?: RenewalOption
  status?: LeaseStatus
  start_date: string
  end_date?: string | null
}

export interface LeaseUpdatePayload {
  monthly_rent?: string
  due_day?: number
  billing_cycle?: BillingCycle
  security_deposit?: string | null
  advance_payment?: string | null
  late_fee_amount?: string | null
  late_fee_percent?: string | null
  grace_period_days?: number
  renewal_option?: RenewalOption
  status?: LeaseStatus
  start_date?: string
  end_date?: string | null
}
