export function ProjectCardSkeleton() {
  return (
    <div className="card flex flex-col gap-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1.5">
          <div className="h-4 bg-surface-700 rounded w-3/4" />
          <div className="h-3 bg-surface-700/50 rounded w-full" />
        </div>
        <div className="h-5 w-16 bg-surface-700 rounded-full flex-shrink-0" />
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-1.5 bg-surface-700 rounded-full" />
        <div className="flex justify-between">
          <div className="h-3 bg-surface-700/50 rounded w-16" />
          <div className="h-3 bg-surface-700/50 rounded w-8" />
        </div>
      </div>

      {/* Pills */}
      <div className="flex gap-1.5">
        <div className="h-4 bg-surface-700 rounded w-12" />
        <div className="h-4 bg-surface-700 rounded w-16" />
      </div>

      {/* Footer */}
      <div className="flex justify-between pt-1 border-t border-surface-700/50">
        <div className="h-3 bg-surface-700/50 rounded w-20" />
        <div className="h-3 bg-surface-700/50 rounded w-8" />
      </div>
    </div>
  )
}