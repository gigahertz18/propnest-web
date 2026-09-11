/**
 * lib/api/dashboardBackend.ts
 *
 * Server-side call to FastAPI's dashboard aggregation endpoint.
 * Only used in Route Handlers — never imported in client components.
 */

import type { DashboardSummary } from "@/types/dashboard"
import { backendFetch } from "@/lib/api/shared/backendFetch"

export async function backendGetDashboardSummary(token: string): Promise<DashboardSummary> {
  return backendFetch<DashboardSummary>("/dashboard/", { method: "GET", token })
}
