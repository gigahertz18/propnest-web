/**
 * lib/api/contracts.ts
 *
 * Client-side contract API — calls Next.js Route Handlers.
 * Safe to import in client components.
 */

import type { Contract, ContractCreatePayload, ContractUpdatePayload } from "@/types/contract"
import { apiFetch } from "@/lib/api/shared/apiFetch"

export const contractsApi = {
  list: (): Promise<Contract[]> => apiFetch<Contract[]>("/api/contracts"),

  get: (id: string): Promise<Contract> => apiFetch<Contract>(`/api/contracts/${id}`),

  create: (payload: ContractCreatePayload): Promise<Contract> =>
    apiFetch<Contract>("/api/contracts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: ContractUpdatePayload): Promise<Contract> =>
    apiFetch<Contract>(`/api/contracts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (id: string): Promise<void> =>
    apiFetch<void>(`/api/contracts/${id}`, { method: "DELETE" }),
}
