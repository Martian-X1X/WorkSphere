import { useMemo } from 'react'
import { Activity, TrendingUp, User, Clock } from 'lucide-react'
import { cn } from '@/utils'
import type { ActivityLog } from '@/types'

interface ActivityStatsProps {
  activities: ActivityLog[]
  isLoading:  boolean
}

interface StatProps {
  icon:    React.ElementType
  label:   string
  value:   string
  sub?:    string
  color?:  string
  loading: boolean
}

function Stat({ icon: Icon, label, value, sub, color = 'text-surface-300', loading }: StatProps) {
  return (
    <div className="card flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-xl bg-surface-700/50 flex items-center
                      justify-center flex-shrink-0">
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      {loading ? (
        <div className="space-y-1.5 animate-pulse">
          <div className="h-5 w-12 bg-surface-700 rounded" />
          <div className="h-3 w-20 bg-surface-700/50 rounded" />
        </div>
      ) : (
        <div>
          <p className={cn('text-xl font-bold leading-none', color)}>{value}</p>
          <p className="text-xs text-surface-500 mt-0.5">{label}</p>
          {sub && <p className="text-[10px] text-surface-600 mt-0.5">{sub}</p>}
        </div>
      )}
    </div>
  )
}

export function ActivityStats({ activities, isLoading }: ActivityStatsProps) {
  const stats = useMemo(() => {
    if (!activities.length) return null

    const now   = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const todayCount = activities.filter(
      a => new Date(a.createdAt) >= today
    ).length

    const weekCount = activities.filter(
      a => new Date(a.createdAt) >= weekAgo
    ).length

    // Most active user
    const userCounts: Record<string, number> = {}
    for (const a of activities) {
      userCounts[a.userName] = (userCounts[a.userName] ?? 0) + 1
    }
    const mostActive = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)[0]

    // Most recent activity time
    const latest = activities[0]
    const latestTime = latest
      ? new Date(latest.createdAt).toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit',
        })
      : '—'

    return { todayCount, weekCount, mostActive, latestTime }
  }, [activities])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Stat
        icon={Activity}
        label="Events today"
        value={String(stats?.todayCount ?? 0)}
        color="text-primary-400"
        loading={isLoading}
      />
      <Stat
        icon={TrendingUp}
        label="This week"
        value={String(stats?.weekCount ?? 0)}
        color="text-blue-400"
        loading={isLoading}
      />
      <Stat
        icon={User}
        label="Most active"
        value={stats?.mostActive?.[0]?.split(' ')[0] ?? '—'}
        sub={stats?.mostActive ? `${stats.mostActive[1]} actions` : undefined}
        color="text-yellow-400"
        loading={isLoading}
      />
      <Stat
        icon={Clock}
        label="Last activity"
        value={stats?.latestTime ?? '—'}
        color="text-green-400"
        loading={isLoading}
      />
    </div>
  )
}