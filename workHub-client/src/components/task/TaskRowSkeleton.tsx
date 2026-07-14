export function TaskRowSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
      <div className="w-16 h-5 bg-surface-700 rounded-full mt-0.5 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-surface-700 rounded w-3/4" />
        <div className="flex gap-2">
          <div className="h-3 bg-surface-700/50 rounded w-16" />
          <div className="h-3 bg-surface-700/50 rounded w-20" />
        </div>
      </div>
      <div className="w-12 h-5 bg-surface-700 rounded-full flex-shrink-0" />
    </div>
  )
}