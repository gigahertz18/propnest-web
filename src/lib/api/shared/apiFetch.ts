/**
 * lib/api/shared/apiFetch.ts
 *
 * Single fetch/error-normalization implementation for every client-side
 * `*Api` module. Safe to import in client components — same-origin requests
 * to Next.js Route Handlers only, no server env vars.
 */

import { ApiError } from "@/types"
import { extractDetail } from "@/lib/api/shared/utility"

function extractFieldErrors(body: unknown): Record<string, string> | undefined {
  const fieldErrors = (body as { fieldErrors?: unknown } | null)?.fieldErrors
  if (!fieldErrors || typeof fieldErrors !== "object") return undefined
  return fieldErrors as Record<string, string>
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  let detail = `Request failed with status ${res.status}`
  let fieldErrors: Record<string, string> | undefined
  try {
    const body = await res.json()
    detail = extractDetail(body, detail)
    fieldErrors = extractFieldErrors(body)
  } catch {
    // response body wasn't JSON — use default message
  }
  return new ApiError(res.status, detail, fieldErrors)
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  if (!res.ok) throw await parseErrorResponse(res)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// Multipart-aware fetch (for uploads) — no Content-Type header so the browser sets the boundary.
export async function apiFetchMultipart<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, options)

  if (!res.ok) throw await parseErrorResponse(res)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// Raw-response variant for binary endpoints (e.g. receipt PDF download) — same
// request/error handling as apiFetch, but hands back the Response itself
// since the caller needs headers + blob(), not a parsed JSON body.
export async function apiFetchRaw(path: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(path, options)
  if (!res.ok) throw await parseErrorResponse(res)
  return res
}
