"use client"

import { useState, useEffect } from "react"
import type {
  Property,
  PropertyCreatePayload,
  PropertyUpdatePayload,
  PropertyStatus,
} from "@/types/property"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { propertiesApi } from "@/lib/api/properties"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ImageUploadZone } from "@/components/ui/ImageUploadZone" 
import type { UploadedImage } from "@/components/ui/ImageUploadZone"


// ─── Property Form ────────────────────────────────────────────────────────────

interface PropertyFormProps {
  property?: Property
  onSubmit: (
    payload: PropertyCreatePayload | PropertyUpdatePayload,
    pendingImages: File[]
  ) => Promise<void>
  onCancel: () => void
}

export function PropertyForm({ property, onSubmit, onCancel }: PropertyFormProps) {
  const isEdit = !!property

  const [name, setName] = useState(property?.name ?? "")
  const [address, setAddress] = useState(property?.address ?? "")
  const [description, setDescription] = useState(property?.description ?? "")
  const [status, setStatus] = useState<PropertyStatus>(property?.status ?? "vacant")
  const [isActive, setIsActive] = useState(property?.is_active ?? true)

  const [existingImages, setExistingImages] = useState<UploadedImage[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [imageLoading, setImageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isEdit || !property?.id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageLoading(true)
    propertiesApi
      .listImages(property.id)
      .then((imgs) => setExistingImages(imgs))
      .catch(() => {})
      .finally(() => setImageLoading(false))
  }, [isEdit, property?.id])

  async function handleRemoveExistingImage(documentId: string) {
    if (!property?.id) return
    try {
      await propertiesApi.deleteImage(property.id, documentId)
      setExistingImages((prev) => prev.filter((img) => img.id !== documentId))
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isEdit) {
        const payload: PropertyUpdatePayload = {}
        if (name !== property.name) payload.name = name
        if (address !== property.address) payload.address = address
        if (description !== (property.description ?? "")) payload.description = description || null
        if (status !== property.status) payload.status = status
        if (isActive !== property.is_active) payload.is_active = isActive
        await onSubmit(payload, pendingFiles)
      } else {
        await onSubmit({ name, address, description: description || null, status }, pendingFiles)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="prop_name">Property name</Label>
        <Input
          id="prop_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sunset Villa"
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="prop_address">Address</Label>
        <Input
          id="prop_address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St, Laguna"
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="prop_description">Description</Label>
        <textarea
          id="prop_description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short description of the property…"
          disabled={loading}
          rows={3}
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as PropertyStatus)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isEdit && (
          <div className="space-y-1.5">
            <Label>Active</Label>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(v) => setIsActive(v === "true")}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>
          Photos
          {imageLoading && <span className="text-muted-foreground ml-2 text-xs">Loading…</span>}
        </Label>
        <ImageUploadZone
          images={existingImages}
          pendingFiles={pendingFiles}
          onAddFiles={(files) => setPendingFiles((prev) => [...prev, ...files])}
          onRemoveImage={handleRemoveExistingImage}
          onRemovePending={(i) => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
          uploading={loading}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !name.trim() || !address.trim()}
          className="bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-white hover:opacity-95"
        >
          {loading
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save changes"
              : "Create property"}
        </Button>
      </div>
    </form>
  )
}
