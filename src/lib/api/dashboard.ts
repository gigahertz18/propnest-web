/**
 * lib/api/dashboard.ts
 *
 * Client-side dashboard API — calls the Next.js Route Handler.
 * Safe to import in client components.
 */

import type { DashboardSummary } from "@/types/dashboard"
import { apiFetch } from "@/lib/api/shared/apiFetch"

export const dashboardApi = {
  get: (): Promise<DashboardSummary> => apiFetch<DashboardSummary>("/api/dashboard"),
}
