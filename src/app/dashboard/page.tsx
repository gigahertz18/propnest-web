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
        className="flex items-center justify-between bg-white px-6 py-4"
        style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.08)" }}
      >
        <span className="text-xl font-bold tracking-tight text-[#FF385C]">propnest</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#484848]">{user.full_name}</span>
          <span className="rounded-full border border-[#DDDDDD] bg-[#F7F7F7] px-2.5 py-1 text-xs text-[#484848] capitalize">
            {user.role}
          </span>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="mb-1 text-2xl font-semibold text-[#222222]">
          Welcome back, {user.full_name.split(" ")[0]}
        </h1>
        <p className="mb-10 text-sm text-[#717171]">What would you like to manage today?</p>

        {/* Quick nav cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Users — admin only */}
          {user.role === "admin" && (
            <Link
              href="/admin/users"
              className="group rounded-2xl border border-[#EBEBEB] bg-white p-6 transition-shadow hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEEDFE]">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M9 9a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 16c0-3.3 3.1-6 7-6s7 2.7 7 6"
                    stroke="#534AB7"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#222222] transition-colors group-hover:text-[#534AB7]">
                Users
              </p>
              <p className="mt-0.5 text-xs text-[#717171]">Manage team access and roles</p>
            </Link>
          )}

          {/* Properties — coming soon placeholder */}
          <div className="rounded-2xl border border-[#EBEBEB] bg-white p-6 opacity-50">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1EFE8]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M2 16V8l7-6 7 6v8M6 16v-5h6v5"
                  stroke="#717171"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#222222]">Properties</p>
            <p className="mt-0.5 text-xs text-[#717171]">Coming soon</p>
          </div>

          {/* Tenants — coming soon placeholder */}
          <div className="rounded-2xl border border-[#EBEBEB] bg-white p-6 opacity-50">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E1F5EE]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M12 9a3 3 0 100-6 3 3 0 000 6zM4.5 16c0-2.8 3.4-5 7.5-5"
                  stroke="#085041"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M2 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5"
                  stroke="#085041"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#222222]">Tenants</p>
            <p className="mt-0.5 text-xs text-[#717171]">Coming soon</p>
          </div>
        </div>
      </main>
    </div>
  )
}
