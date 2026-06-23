import Image from "next/image"
import { useState, useRef } from "react"

export type UploadedImage = {
  id: string
  file_url: string
  filename: string
}

// ─── Image Upload Zone ────────────────────────────────────────────────────────

interface ImageUploadZoneProps {
  images: UploadedImage[]
  pendingFiles: File[]
  onAddFiles: (files: File[]) => void
  onRemoveImage: (id: string) => void
  onRemovePending: (index: number) => void
  uploading?: boolean
}

export function ImageUploadZone({
  images,
  pendingFiles,
  onAddFiles,
  onRemoveImage,
  onRemovePending,
  uploading,
}: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))
    if (files.length) onAddFiles(files)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onAddFiles(files)
    e.target.value = ""
  }

  const totalCount = images.length + pendingFiles.length

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          dragging
            ? "border-[#E31C5F] bg-red-50"
            : "border-neutral-200 bg-neutral-50 hover:border-neutral-300",
        ].join(" ")}
      >
        <svg
          className="mb-2 h-7 w-7 text-neutral-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 10l-4-4m0 0L8 10m4-4v12"
          />
        </svg>
        <p className="text-sm font-medium text-neutral-600">
          Drop photos here or <span className="text-[#E31C5F]">browse</span>
        </p>
        <p className="mt-0.5 text-xs text-neutral-400">PNG, JPG, WEBP up to 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInput}
          disabled={uploading}
        />
      </div>

      {totalCount > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200"
            >
              {img.file_url ? (
                <Image
                  src={img.file_url}
                  alt={img.filename}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-neutral-50">
                  <span className="px-1 text-center text-xs text-neutral-400">{img.filename}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemoveImage(img.id)}
                className="absolute top-1 right-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white group-hover:flex"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 12 12"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" d="M2 2l8 8M10 2l-8 8" />
                </svg>
              </button>
            </div>
          ))}

          {pendingFiles.map((file, i) => {
            const url = URL.createObjectURL(file)
            return (
              <div
                key={`pending-${i}`}
                className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200 opacity-60"
              >
                <Image
                  src={url}
                  alt={file.name}
                  fill
                  className="object-cover"
                  unoptimized
                  onLoad={() => URL.revokeObjectURL(url)}
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/40 to-transparent p-1.5">
                  <span className="w-full truncate text-[10px] leading-none text-white">
                    {uploading ? "Uploading…" : "Ready"}
                  </span>
                </div>
                {!uploading && (
                  <button
                    type="button"
                    onClick={() => onRemovePending(i)}
                    className="absolute top-1 right-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white group-hover:flex"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 12 12"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" d="M2 2l8 8M10 2l-8 8" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
