export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Navbar skeleton */}
      <header
        className="flex items-center justify-between bg-white px-6 py-4"
        style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.08)" }}
      >
        <span className="text-xl font-bold tracking-tight text-[#FF385C]">propnest</span>
        <div className="flex items-center gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-[#EBEBEB]" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-[#EBEBEB]" />
          <div className="h-8 w-16 animate-pulse rounded-lg bg-[#EBEBEB]" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-1 h-7 w-64 animate-pulse rounded bg-[#EBEBEB]" />
        <div className="mt-2 mb-10 h-4 w-48 animate-pulse rounded bg-[#EBEBEB]" />

        {/* Metrics grid skeleton */}
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#EBEBEB]" />
          ))}
        </div>

        {/* Quick nav cards skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#EBEBEB] bg-white p-6">
              <div className="mb-4 h-10 w-10 animate-pulse rounded-xl bg-[#EBEBEB]" />
              <div className="mb-2 h-4 w-20 animate-pulse rounded bg-[#EBEBEB]" />
              <div className="h-3 w-32 animate-pulse rounded bg-[#EBEBEB]" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
