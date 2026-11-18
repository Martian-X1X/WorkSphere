import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { cn } from '@/utils'
import type { RecentActivity } from '@/types/analytics'

interface RecentActivityFeedProps {
  activities: RecentActivity[]
  loading?: boolean
}

const actionColors: Record<string, string> = {
  created: 'text-blue-400',
  completed: 'text-green-400',
  commented: 'text-yellow-400',
  updated: 'text-surface-400',
  assigned: 'text-purple-400',
  deleted: 'text-red-400',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function RecentActivityFeed({ activities, loading }: RecentActivityFeedProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="bg-surface-800/60 border border-surface-700/40 rounded-2xl p-5 space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-700 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-surface-700 rounded w-3/4" />
              <div className="h-3 bg-surface-700 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-surface-800/60 border border-surface-700/40 rounded-2xl p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-surface-100">Recent Activity</h3>
        <p className="text-xs text-surface-500 mt-0.5">What&apos;s been happening</p>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-surface-500 text-center py-8">No activity yet</p>
      ) : (
        <div className="space-y-4">
          {activities.map((a) => {
            const createdAt = parseISO(a.createdAt)
            return (
              <div
                key={a.id}
                className={cn('flex items-start gap-3', a.actionUrl && 'cursor-pointer group')}
                onClick={() => a.actionUrl && navigate(a.actionUrl)}
              >
                <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  {a.actorAvatar ? (
                    <img
                      src={a.actorAvatar}
                      alt={a.actorName}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-primary-400">
                      {getInitials(a.actorName)}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-surface-300 leading-relaxed">
                    <span className="font-semibold text-surface-200">{a.actorName}</span>{' '}
                    <span className={actionColors[a.action] ?? 'text-surface-400'}>
                      {a.action}
                    </span>{' '}
                    <span
                      className={cn(
                        'text-surface-200',
                        a.actionUrl && 'group-hover:text-primary-400 transition-colors',
                      )}
                    >
                      {a.entityName}
                    </span>
                    {a.projectName && (
                      <span className="text-surface-500"> in {a.projectName}</span>
                    )}
                  </p>
                  <p className="text-[10px] text-surface-600 mt-0.5">
                    {Number.isNaN(createdAt.getTime())
                      ? ''
                      : formatDistanceToNow(createdAt, { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
