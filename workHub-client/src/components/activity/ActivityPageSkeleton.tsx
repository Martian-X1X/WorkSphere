export function ActivityPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-32 bg-surface-700 rounded" />
        <div className="h-4 w-64 bg-surface-700/50 rounded" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card flex items-center gap-3 py-3">
            <div className="w-10 h-10 rounded-xl bg-surface-700" />
            <div className="space-y-1.5">
              <div className="h-5 w-12 bg-surface-700 rounded" />
              <div className="h-3 w-20 bg-surface-700/50 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-surface-700/50 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-44 bg-surface-700/30 rounded-lg" />
          <div className="h-10 w-44 bg-surface-700/30 rounded-lg" />
        </div>
      </div>

      {/* Activity items */}
      <div className="card p-5 space-y-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-full bg-surface-700 flex-shrink-0" />
              {i < 7 && <div className="w-px h-8 bg-surface-700/40" />}
            </div>
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-4 bg-surface-700 rounded w-3/4" />
              <div className="h-3 bg-surface-700/60 rounded w-1/2" />
              <div className="h-3 bg-surface-700/40 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}