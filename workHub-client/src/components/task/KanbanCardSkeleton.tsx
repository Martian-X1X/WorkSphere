export function KanbanCardSkeleton() {
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-3
                    animate-pulse">
      {/* Priority bar */}
      <div className="h-0.5 w-full bg-surface-700 rounded-full mb-3" />
      {/* Title */}
      <div className="h-4 bg-surface-700 rounded w-5/6 mb-1" />
      <div className="h-4 bg-surface-700/60 rounded w-3/4 mb-3" />
      {/* Description */}
      <div className="h-3 bg-surface-700/40 rounded w-full mb-1" />
      <div className="h-3 bg-surface-700/40 rounded w-4/5 mb-3" />
      {/* Footer */}
      <div className="flex items-center justify-between pt-2
                      border-t border-surface-700/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-surface-700" />
          <div className="h-3 w-16 bg-surface-700/60 rounded" />
        </div>
        <div className="h-5 w-12 bg-surface-700 rounded-full" />
      </div>
    </div>
  )
}