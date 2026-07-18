export function MembersPageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-surface-700 rounded animate-pulse" />
          <div className="h-4 w-56 bg-surface-700/50 rounded animate-pulse" />
        </div>
        <div className="h-9 w-32 bg-surface-700 rounded-lg animate-pulse" />
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column — org info */}
        <div className="xl:col-span-1 space-y-4">
          <div className="card space-y-3">
            <div className="h-24 bg-surface-700/30 rounded-lg animate-pulse" />
          </div>
          <div className="card space-y-3">
            <div className="h-4 w-24 bg-surface-700 rounded animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3 w-28 bg-surface-700/50 rounded animate-pulse" />
                  <div className="h-4 w-6 bg-surface-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — members */}
        <div className="xl:col-span-2 space-y-5">
          {/* Pending invites skeleton */}
          <div className="card space-y-2 p-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-surface-700 rounded animate-pulse" />
              <div className="h-4 w-24 bg-surface-700 rounded animate-pulse" />
            </div>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-12 bg-surface-700/30 rounded-lg animate-pulse" />
            ))}
          </div>

          {/* Members list skeleton */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 bg-surface-700 rounded animate-pulse" />
              <div className="h-4 w-28 bg-surface-700 rounded animate-pulse" />
              <div className="ml-auto h-6 w-6 bg-surface-700 rounded animate-pulse" />
            </div>
            <div className="h-10 bg-surface-700/30 rounded-lg animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-surface-700/30 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
