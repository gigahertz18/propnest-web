// ─── Contracts ──────────────────────────────────────────────────────────────

export type RentalType = "long_term" | "short_term"

export type ContractStatus = "ACTIVE" | "EXPIRED" | "TERMINATED"

export interface Contract {
  id: string
  property_id: string
  tenant_id: string
  rental_type: RentalType
  start_date: string
  end_date: string | null
  rent_amount: string
  deposit: string | null
  booking_source: string
  status: ContractStatus
  created_at: string
  updated_at: string
}

export interface ContractCreatePayload {
  property_id: string
  tenant_id: string
  rental_type: RentalType
  start_date: string
  end_date?: string | null
  rent_amount: string
  deposit?: string | null
  booking_source?: string
  status?: ContractStatus
}

export interface ContractUpdatePayload {
  rental_type?: RentalType
  start_date?: string
  end_date?: string | null
  rent_amount?: string
  deposit?: string | null
  booking_source?: string
  status?: ContractStatus
}
