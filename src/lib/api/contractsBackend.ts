/**
 * lib/api/contractsBackend.ts
 *
 * Server-side calls to FastAPI contract endpoints.
 * Only used in Route Handlers — never imported in client components.
 */

import type { Contract, ContractCreatePayload, ContractUpdatePayload } from "@/types/contract"
import { backendFetch, backendFetchList } from "@/lib/api/shared/backendFetch"

export async function backendListContracts(token: string): Promise<Contract[]> {
  return backendFetchList<Contract>("/contracts/", { method: "GET", token })
}

export async function backendGetContract(token: string, id: string): Promise<Contract> {
  return backendFetch<Contract>(`/contracts/${id}`, { method: "GET", token })
}

export async function backendCreateContract(
  token: string,
  payload: ContractCreatePayload
): Promise<Contract> {
  return backendFetch<Contract>("/contracts/", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  })
}

export async function backendUpdateContract(
  token: string,
  id: string,
  payload: ContractUpdatePayload
): Promise<Contract> {
  return backendFetch<Contract>(`/contracts/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  })
}

export async function backendDeleteContract(token: string, id: string): Promise<void> {
  return backendFetch<void>(`/contracts/${id}`, { method: "DELETE", token })
}
