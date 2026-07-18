import { ProjectCardSkeleton } from './ProjectCardSkeleton'

export function ProjectsPageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-surface-700 rounded animate-pulse" />
          <div className="h-4 w-56 bg-surface-700/50 rounded animate-pulse" />
        </div>
        <div className="h-9 w-32 bg-surface-700 rounded-lg animate-pulse" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 bg-surface-700/50 rounded-lg animate-pulse"
          />
        ))}
      </div>

      {/* Search bar */}
      <div className="h-10 bg-surface-700/30 rounded-lg animate-pulse" />

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}