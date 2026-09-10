export function NotificationSkeleton() {
  return (
    <div className="space-y-0.5 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-xl bg-surface-700 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-surface-700 rounded w-3/4" />
            <div className="h-3 bg-surface-700/60 rounded w-full" />
            <div className="h-3 bg-surface-700/40 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
