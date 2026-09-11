/**
 * lib/api/shared/backendFetch.ts
 *
 * Single fetch/error-normalization implementation for every server-side
 * *Backend.ts module. Only used server-side (Route Handlers) — never import
 * in client components, it reads server env vars.
 */

import { ApiError } from "@/types"
import { extractDetail } from "@/lib/api/shared/utility"

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000"
export const API_PREFIX = "/api/v1"

const DEFAULT_TIMEOUT_MS = 15_000
const TIMEOUT_MS = Number(process.env.BACKEND_FETCH_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS

/**
 * FastAPI's 422 `detail` array carries a `loc` (e.g. ["body", "reference_number"])
 * pinpointing which field a validation error belongs to. `extractDetail` discards
 * `loc` in favor of one flattened message string; this reads it back out so a
 * field-specific error can be routed to that field in the UI instead of only a
 * generic toast. Previously only paymentsBackend.ts did this — now every
 * resource's ApiError carries it.
 */
function extractFieldErrors(body: unknown): Record<string, string> | undefined {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (!Array.isArray(detail)) return undefined

  const fieldErrors: Record<string, string> = {}
  for (const entry of detail) {
    if (!entry || typeof entry !== "object" || !("loc" in entry) || !("msg" in entry)) continue
    const loc = (entry as { loc: unknown }).loc
    if (!Array.isArray(loc) || loc.length === 0) continue
    const field = String(loc[loc.length - 1])
    fieldErrors[field] = String((entry as { msg: unknown }).msg)
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
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

async function rawFetch(path: string, options: RequestInit): Promise<Response> {
  // Only install our own timeout when the caller hasn't supplied a signal —
  // otherwise an abort of *their* signal would be misreported as a timeout.
  const ownsTimeout = !options.signal
  const controller = ownsTimeout ? new AbortController() : undefined
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : undefined

  try {
    return await fetch(`${BACKEND_URL}${API_PREFIX}${path}`, {
      ...options,
      signal: controller?.signal ?? options.signal,
    })
  } catch (err) {
    if (ownsTimeout && err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(504, "Request to backend timed out")
    }
    throw err
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function backendFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await rawFetch(path, { ...fetchOptions, headers })

  if (!res.ok) throw await parseErrorResponse(res)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// Multipart-aware fetch (for uploads) — no Content-Type header so the runtime sets the boundary.
export async function backendFetchMultipart<T>(
  path: string,
  options: RequestInit & { token: string }
): Promise<T> {
  const { token, ...fetchOptions } = options

  const res = await rawFetch(path, {
    ...fetchOptions,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(fetchOptions.headers as Record<string, string>),
    },
  })

  if (!res.ok) throw await parseErrorResponse(res)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// Raw-response variant for binary endpoints (e.g. receipt PDF download) — same
// request/timeout/error handling as backendFetch, but hands back the Response
// itself since the caller needs headers + arrayBuffer(), not a parsed JSON body.
export async function backendFetchRaw(
  path: string,
  options: RequestInit & { token: string }
): Promise<Response> {
  const { token, ...fetchOptions } = options
  const res = await rawFetch(path, {
    ...fetchOptions,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(fetchOptions.headers as Record<string, string>),
    },
  })
  if (!res.ok) throw await parseErrorResponse(res)
  return res
}

// List-endpoint variant — FastAPI's list endpoints wrap results in a
// {items,total} paginated envelope; callers that don't need `total` just
// want the bare array.
export async function backendFetchList<T>(
  path: string,
  options: RequestInit & { token?: string }
): Promise<T[]> {
  const page = await backendFetch<{ items: T[]; total: number }>(path, options)
  return page.items
}
