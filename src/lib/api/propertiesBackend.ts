/**
 * lib/api/propertiesBackend.ts
 *
 * Server-side calls to FastAPI property endpoints.
 * Only used in Route Handlers — never imported in client components.
 */

import type { Property, PropertyCreatePayload, PropertyUpdatePayload } from "@/types/property"
import {
  backendFetch,
  backendFetchMultipart,
  backendFetchList,
} from "@/lib/api/shared/backendFetch"

export async function backendListProperties(token: string): Promise<Property[]> {
  return backendFetchList<Property>("/properties/", { method: "GET", token })
}

export async function backendGetProperty(token: string, id: string): Promise<Property> {
  return backendFetch<Property>(`/properties/${id}`, { method: "GET", token })
}

export async function backendCreateProperty(
  token: string,
  payload: PropertyCreatePayload
): Promise<Property> {
  return backendFetch<Property>("/properties/", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  })
}

export async function backendUpdateProperty(
  token: string,
  id: string,
  payload: PropertyUpdatePayload
): Promise<Property> {
  return backendFetch<Property>(`/properties/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  })
}

export async function backendDeleteProperty(token: string, id: string): Promise<void> {
  return backendFetch<void>(`/properties/${id}`, { method: "DELETE", token })
}

/**
 * Upload property images via the documents/upload endpoint.
 * The backend accepts multipart/form-data with a `file` field.
 * Returns the created document (which contains the MinIO file_url).
 */
export async function backendUploadPropertyImage(
  token: string,
  propertyId: string,
  file: File
): Promise<{ id: string; file_url: string; filename: string }> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("property_id", propertyId)
  formData.append("document_type", "photo")
  formData.append("title", file.name)

  return backendFetchMultipart(`/documents/upload`, {
    method: "POST",
    token,
    body: formData,
  })
}

export async function backendListPropertyImages(
  token: string,
  propertyId: string
): Promise<Array<{ id: string; file_url: string; filename: string }>> {
  // Documents are filtered server-side by property_id
  const docs = await backendFetch<
    Array<{
      id: string
      file_url: string
      filename: string
      property_id: string
      document_type: string
    }>
  >(`/documents/?skip=0&limit=200`, { method: "GET", token })

  return docs.filter((d) => d.property_id === propertyId && d.document_type === "photo")
}

export async function backendDeleteDocument(token: string, documentId: string): Promise<void> {
  return backendFetch<void>(`/documents/${documentId}`, { method: "DELETE", token })
}
