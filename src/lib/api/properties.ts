/**
 * lib/api/properties.ts
 *
 * Client-side property API — calls Next.js Route Handlers.
 * Safe to import in client components.
 */

import type { Property, PropertyCreatePayload, PropertyUpdatePayload } from "@/types/property"
import { apiFetch, apiFetchMultipart } from "@/lib/api/shared/apiFetch"

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

  uploadImage: (
    propertyId: string,
    file: File
  ): Promise<{ id: string; file_url: string; filename: string }> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("property_id", propertyId)
    formData.append("document_type", "photo")
    formData.append("title", file.name)

    return apiFetchMultipart(`/api/properties/${propertyId}/images`, {
      method: "POST",
      body: formData,
    })
  },

  listImages: (
    propertyId: string
  ): Promise<Array<{ id: string; file_url: string; filename: string }>> =>
    apiFetch(`/api/properties/${propertyId}/images`),

  deleteImage: (propertyId: string, documentId: string): Promise<void> =>
    apiFetch<void>(`/api/properties/${propertyId}/images/${documentId}`, { method: "DELETE" }),
}
