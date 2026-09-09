/**
 * lib/api/contracts.ts
 *
 * Client-side contract API — calls Next.js Route Handlers.
 * Safe to import in client components.
 */

import type { Contract, ContractCreatePayload, ContractUpdatePayload } from "@/types/contract"
import { ApiError } from "@/types"
import { extractDetail } from "@/lib/api/utility"

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`
    try {
      const body = await res.json()
      detail = extractDetail(body, detail)
    } catch {
      /* non-JSON response */
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

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
