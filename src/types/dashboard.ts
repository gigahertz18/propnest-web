// ─── Dashboard ──────────────────────────────────────────────────────────────
//
// Mirrors propnest-api's DashboardSummaryResponse — a single composed
// aggregation, not six independently-queryable endpoints (see
// dashboard.py's GET /). total_credits is part of the wire contract but
// isn't one of the six metrics the frontend surfaces (see phase-2.md); it's
// kept in the type for fidelity to the API response, not rendered.

import type { BillingRecord } from "./billing"
import type { Lease } from "./lease"
import type { Payment } from "./payment"

export interface DashboardSummary {
  collected_this_month: string
  outstanding: string
  total_credits: string
  late_payments: BillingRecord[]
  vacant_units: number
  expiring_leases: Lease[]
  recent_payments: Payment[]
}
