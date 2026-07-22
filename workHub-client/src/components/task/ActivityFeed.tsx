import { formatRelative, formatDateTime } from '@/utils'
import { Avatar } from '@/components/ui/Avatar'
import type { ActivityLog } from '@/types'

interface ActivityFeedProps {
  activities: ActivityLog[]
  isLoading:  boolean
}

// ── Action label map ───────────────────────────────────────────────
function getActionLabel(activity: ActivityLog): string {
  const meta = activity.metadata as Record<string, string> | null

  switch (activity.action) {
    case 'TaskCreated':
      return 'created this task'
    case 'TaskUpdated':
      return 'updated this task'
    case 'TaskStatusChanged':
      return meta?.from && meta?.to
        ? `changed status from ${meta.from} to ${meta.to}`
        : 'changed the status'
    case 'TaskPriorityChanged':
      return meta?.from && meta?.to
        ? `changed priority from ${meta.from} to ${meta.to}`
        : 'changed the priority'
    case 'TaskAssigned':
      return meta?.assignedTo
        ? `assigned this task to ${meta.assignedTo}`
        : 'changed the assignee'
    case 'TaskUnassigned':
      return 'removed the assignee'
    case 'CommentAdded':
      return 'added a comment'
    case 'CommentDeleted':
      return 'deleted a comment'
    case 'TaskDeleted':
      return 'deleted this task'
    default:
      return activity.action
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase()
  }
}

// ── Activity dot color ─────────────────────────────────────────────
function getDotColor(action: string): string {
  if (action.includes('Status'))   return 'bg-blue-400'
  if (action.includes('Created'))  return 'bg-green-400'
  if (action.includes('Deleted'))  return 'bg-red-400'
  if (action.includes('Comment'))  return 'bg-purple-400'
  if (action.includes('Assigned')) return 'bg-yellow-400'
  return 'bg-surface-500'
}

// ── Skeleton ───────────────────────────────────────────────────────
function ActivitySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-700 flex-shrink-0" />
          <div className="flex-1 space-y-1.5 pt-1">
            <div className="h-3 bg-surface-700 rounded w-3/4" />
            <div className="h-3 bg-surface-700/50 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) return <ActivitySkeleton />

  if (activities.length === 0) {
    return (
      <p className="text-sm text-surface-600 italic text-center py-4">
        No activity yet
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-3 group">
          {/* ── Timeline line + avatar ───────────────────── */}
          <div className="flex flex-col items-center">
            <Avatar name={activity.userName} size="sm" />
            {/* Vertical line connecting entries */}
            {index < activities.length - 1 && (
              <div className="w-px flex-1 bg-surface-700/50 mt-1 mb-1
                              min-h-[16px]" />
            )}
          </div>

          {/* ── Activity content ─────────────────────────── */}
          <div className="flex-1 pb-4 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-surface-300 leading-snug">
                <span className="font-medium text-surface-100">
                  {activity.userName}
                </span>
                {' '}
                <span className="text-surface-400">
                  {getActionLabel(activity)}
                </span>
              </p>

              {/* Dot indicator */}
              <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5
                               ${getDotColor(activity.action)}`} />
            </div>

            {/* Timestamp */}
            <p
              className="text-xs text-surface-600 mt-0.5"
              title={formatDateTime(activity.createdAt)}
            >
              {formatRelative(activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}