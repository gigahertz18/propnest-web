import { getCurrentUser } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import LogoutButton from "@/components/layout/LogoutButton"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Navbar stub */}
      <header
        className="bg-white px-6 py-4 flex items-center justify-between"
        style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.08)" }}
      >
        <span className="text-[#FF385C] font-bold text-xl tracking-tight">
          propnest
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#484848]">{user.full_name}</span>
          <span className="text-xs bg-[#F7F7F7] text-[#484848] border border-[#DDDDDD] px-2.5 py-1 rounded-full capitalize">
            {user.role}
          </span>
          <LogoutButton />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-[#222222] mb-2">
          Welcome back, {user.full_name.split(" ")[0]}
        </h1>
        <p className="text-[#717171] text-sm">
          Auth is working. Dashboard coming next.
        </p>
      </main>
    </div>
  )
}
