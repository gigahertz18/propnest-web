/**
 * lib/api/properties.ts
 *
 * Client-side property API — calls Next.js Route Handlers.
 * Safe to import in client components.
 */

import type { Property, PropertyCreatePayload, PropertyUpdatePayload } from "@/types/property"
import { ApiError } from "@/types"

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail ?? detail
    } catch {
      /* non-JSON response */
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const propertiesApi = {
  list: (): Promise<Property[]> => apiFetch<Property[]>("/api/properties"),

  create: (payload: PropertyCreatePayload): Promise<Property> =>
    apiFetch<Property>("/api/properties", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: PropertyUpdatePayload): Promise<Property> =>
    apiFetch<Property>(`/api/properties/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (id: string): Promise<void> =>
    apiFetch<void>(`/api/properties/${id}`, { method: "DELETE" }),

  uploadImage: async (
    propertyId: string,
    file: File
  ): Promise<{ id: string; file_url: string; filename: string }> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("property_id", propertyId)
    formData.append("document_type", "photo")
    formData.append("title", file.name)

    const res = await fetch(`/api/properties/${propertyId}/images`, {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      let detail = `Upload failed with status ${res.status}`
      try {
        const body = await res.json()
        detail = body.detail ?? detail
      } catch {
        /* non-JSON */
      }
      throw new ApiError(res.status, detail)
    }

    return res.json()
  },

  listImages: (
    propertyId: string
  ): Promise<Array<{ id: string; file_url: string; filename: string }>> =>
    apiFetch(`/api/properties/${propertyId}/images`),

  deleteImage: (propertyId: string, documentId: string): Promise<void> =>
    apiFetch<void>(`/api/properties/${propertyId}/images/${documentId}`, { method: "DELETE" }),
}
