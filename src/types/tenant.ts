// ─── Tenants ────────────────────────────────────────────────────────────────

export interface Tenant {
  id: string
  full_name: string
  email: string
  phone_number: string
  date_of_birth: string
  current_address: string
  occupation: string | null
  notes: string | null
  is_active: boolean
  user_id: string | null
  created_at: string
  updated_at: string
}

export interface TenantCreatePayload {
  full_name: string
  email: string
  phone_number: string
  date_of_birth: string
  current_address: string
  occupation?: string | null
  notes?: string | null
  is_active?: boolean
}

export interface TenantUpdatePayload {
  full_name?: string
  email?: string
  phone_number?: string
  date_of_birth?: string
  current_address?: string
  occupation?: string | null
  notes?: string | null
  is_active?: boolean
}
