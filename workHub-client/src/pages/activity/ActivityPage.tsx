import { useState, useMemo } from 'react'
import { RefreshCw, Activity, CheckCircle2 } from 'lucide-react'
import { EmptyState }         from '@/components/ui/EmptyState'
import { QueryError }         from '@/components/ui/QueryError'
import { ActivityItem }       from '@/components/activity/ActivityItem'
import { ActivityFilterBar,
         ACTION_CATEGORY_MAP,
         type ActivityCategory } from '@/components/activity/ActivityFilterBar'
import { ActivityStats }      from '@/components/activity/ActivityStats'
import { ActivityPageSkeleton } from '@/components/activity/ActivityPageSkeleton'
import { useOrgActivity }     from '@/hooks/useActivity'
import { useProjects }        from '@/hooks/useProjects'
import { useMembers }         from '@/hooks/useOrganization'
import { cn }                 from '@/utils'

// ── Page size options ──────────────────────────────────────────────
const PAGE_SIZES = [25, 50, 100] as const

export default function ActivityPage() {
  // ── Filter state ─────────────────────────────────────────────────
  const [category,       setCategory]       = useState<ActivityCategory>('all')
  const [projectFilter,  setProjectFilter]  = useState('')
  const [userFilter,     setUserFilter]     = useState('')
  const [pageSize,       setPageSize]       = useState<number>(50)
  const [autoRefresh,    setAutoRefresh]    = useState(true)

  // ── Data ─────────────────────────────────────────────────────────
  const {
    data:       activityData,
    isLoading,
    error,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useOrgActivity(1, pageSize)

  const { data: projectsData } = useProjects({})
  const { data: members }      = useMembers()

  const allActivities  = activityData?.items    ?? []
  const totalCount     = activityData?.totalCount ?? 0
  const projects       = projectsData?.items      ?? []

  // ── Client-side filtering ─────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = allActivities

    // Category filter (by action type)
    if (category !== 'all') {
      items = items.filter(a =>
        ACTION_CATEGORY_MAP[a.action] === category
      )
    }

    // Project filter
    if (projectFilter) {
      items = items.filter(a => a.projectId === projectFilter)
    }

    // User filter
    if (userFilter) {
      items = items.filter(a => a.userId === userFilter)
    }

    return items
  }, [allActivities, category, projectFilter, userFilter])

  const hasFilters = category !== 'all' || !!projectFilter || !!userFilter

  // ── Last updated display ──────────────────────────────────────────
  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    : null

  // ── Error state ───────────────────────────────────────────────────
  if (error) {
    return (
      <QueryError
        error={error}
        onRetry={refetch}
        title="Failed to load activity"
      />
    )
  }

  // ── Loading skeleton ──────────────────────────────────────────────
  if (isLoading) return <ActivityPageSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Activity</h1>
          <p className="text-surface-400 mt-1 text-sm">
            Everything happening in your organization
            {totalCount > 0 && (
              <span className="ml-1 text-surface-500">
                · {totalCount} total event{totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Last updated */}
          {lastUpdated && (
            <span className="text-xs text-surface-600 hidden sm:inline">
              Updated {lastUpdated}
            </span>
          )}

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs',
              'font-medium border transition-colors',
              autoRefresh
                ? 'bg-green-900/30 border-green-800/50 text-green-400'
                : 'border-surface-700 text-surface-500 hover:border-surface-600',
            )}
            title={autoRefresh ? 'Auto-refresh on (every 30s)' : 'Auto-refresh off'}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {autoRefresh ? 'Live' : 'Paused'}
            </span>
          </button>

          {/* Manual refresh */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 border border-surface-700 rounded-lg text-surface-500
                       hover:text-surface-300 hover:border-surface-600
                       bg-surface-800/50 transition-colors"
            title="Refresh now"
          >
            <RefreshCw className={cn(
              'w-4 h-4',
              isFetching && 'animate-spin'
            )} />
          </button>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────── */}
      <ActivityStats
        activities={allActivities}
        isLoading={isLoading}
      />

      {/* ── Filter bar ───────────────────────────────────── */}
      <ActivityFilterBar
        category={category}
        onCategoryChange={setCategory}
        projectFilter={projectFilter}
        onProjectChange={setProjectFilter}
        userFilter={userFilter}
        onUserChange={setUserFilter}
        projects={projects}
        members={members ?? []}
      />

      {/* ── Results count + page size ─────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">
          {hasFilters
            ? `${filtered.length} of ${allActivities.length} events`
            : `${filtered.length} event${filtered.length !== 1 ? 's' : ''}`}
          {isFetching && (
            <span className="ml-2 text-primary-400 text-xs animate-pulse">
              Refreshing...
            </span>
          )}
        </p>

        {/* Page size control */}
        <div className="flex items-center gap-2 text-xs text-surface-500">
          <span className="hidden sm:inline">Show:</span>
          <div className="flex items-center gap-1">
            {PAGE_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setPageSize(size)}
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium transition-colors',
                  pageSize === size
                    ? 'bg-surface-700 text-surface-200'
                    : 'text-surface-500 hover:text-surface-300',
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Activity feed ────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={hasFilters ? 'No activity matches your filters' : 'No activity yet'}
          description={
            hasFilters
              ? 'Try changing your filters to see more events'
              : 'Activity from projects, tasks, and members will appear here'
          }
          actionLabel={hasFilters ? 'Clear filters' : undefined}
          onAction={hasFilters ? () => {
            setCategory('all')
            setProjectFilter('')
            setUserFilter('')
          } : undefined}
        />
      ) : (
        <div className="card p-5">
          {/* Live indicator when refreshing */}
          {isFetching && (
            <div className="flex items-center gap-2 mb-4 pb-4
                            border-b border-surface-700/50">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-surface-500">
                Syncing latest activity...
              </span>
            </div>
          )}

          {/* Timeline */}
          <div>
            {filtered.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                showLine={index < filtered.length - 1}
              />
            ))}
          </div>

          {/* Footer */}
          {totalCount > allActivities.length && (
            <div className="mt-4 pt-4 border-t border-surface-700/50 text-center">
              <p className="text-xs text-surface-500">
                Showing {allActivities.length} of {totalCount} events
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-xs text-surface-600">
                  Increase page size to see more
                </span>
                <button
                  onClick={() => setPageSize(100)}
                  className="text-xs text-primary-400 hover:text-primary-300
                             transition-colors font-medium"
                >
                  Load 100
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}