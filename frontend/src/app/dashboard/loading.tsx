export default function DashboardLoading() {
  return (
    <div className="page-content space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-56 rounded-xl" />
          <div className="skeleton h-4 w-40 rounded-lg" />
        </div>
        <div className="skeleton h-9 w-32 rounded-xl" />
      </div>

      {/* Store URL card */}
      <div className="skeleton h-24 w-full rounded-2xl" />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <div className="skeleton h-9 w-9 rounded-xl" />
            <div className="skeleton h-7 w-16 rounded-lg" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <div className="skeleton h-5 w-36 rounded-lg" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="skeleton h-10 w-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/3 rounded" />
              </div>
              <div className="skeleton h-6 w-14 rounded-full" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <div className="skeleton h-5 w-28 rounded-lg" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-8 w-8 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-3/4 rounded" />
                  <div className="skeleton h-2.5 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
