import type { ReactNode } from "react"
import AdminNav from "@/components/layout/AdminNav"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminNav />
      {children}
    </div>
  )
}
