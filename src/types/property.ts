// ─── Properties ───────────────────────────────────────────────────────────────

export type PropertyStatus = "vacant" | "occupied"

export interface Property {
  id: string
  name: string
  address: string
  description: string | null
  status: PropertyStatus
  is_active: boolean
  manager_id: string | null
  created_at: string
  updated_at: string
  // Client-side only: images are fetched from documents endpoint filtered by property
  image_urls?: string[]
}

export interface PropertyCreatePayload {
  name: string
  address: string
  description?: string | null
  status: PropertyStatus
}

export interface PropertyUpdatePayload {
  name?: string
  address?: string
  description?: string | null
  status?: PropertyStatus
  is_active?: boolean
}
