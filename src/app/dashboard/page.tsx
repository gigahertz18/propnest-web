import { getCurrentUser } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import LogoutButton from "@/components/layout/LogoutButton"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Navbar */}
      <header
        className="bg-white px-6 py-4 flex items-center justify-between"
        style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.08)" }}
      >
        <span className="text-[#FF385C] font-bold text-xl tracking-tight">
          propnest
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#484848]">{user.full_name}</span>
          <span className="text-xs bg-[#F7F7F7] text-[#484848] border
                           border-[#DDDDDD] px-2.5 py-1 rounded-full capitalize">
            {user.role}
          </span>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-[#222222] mb-1">
          Welcome back, {user.full_name.split(" ")[0]}
        </h1>
        <p className="text-[#717171] text-sm mb-10">
          What would you like to manage today?
        </p>

        {/* Quick nav cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Users — admin only */}
          {user.role === "admin" && (
            <Link
              href="/admin/users"
              className="bg-white border border-[#EBEBEB] rounded-2xl p-6
                         hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]
                         transition-shadow group"
            >
              <div className="w-10 h-10 bg-[#EEEDFE] rounded-xl flex items-center
                              justify-center mb-4">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 9a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 16c0-3.3 3.1-6 7-6s7 2.7 7 6"
                    stroke="#534AB7" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#222222] group-hover:text-[#534AB7]
                            transition-colors">
                Users
              </p>
              <p className="text-xs text-[#717171] mt-0.5">
                Manage team access and roles
              </p>
            </Link>
          )}

          {/* Properties — coming soon placeholder */}
          <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 opacity-50">
            <div className="w-10 h-10 bg-[#F1EFE8] rounded-xl flex items-center
                            justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 16V8l7-6 7 6v8M6 16v-5h6v5"
                  stroke="#717171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#222222]">Properties</p>
            <p className="text-xs text-[#717171] mt-0.5">Coming soon</p>
          </div>

          {/* Tenants — coming soon placeholder */}
          <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 opacity-50">
            <div className="w-10 h-10 bg-[#E1F5EE] rounded-xl flex items-center
                            justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M12 9a3 3 0 100-6 3 3 0 000 6zM4.5 16c0-2.8 3.4-5 7.5-5"
                  stroke="#085041" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M2 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5"
                  stroke="#085041" strokeWidth="1.5"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#222222]">Tenants</p>
            <p className="text-xs text-[#717171] mt-0.5">Coming soon</p>
          </div>

        </div>
      </main>
    </div>
  )
}
