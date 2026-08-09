import {
  CheckSquare,
  FolderKanban,
  MessageSquare,
  Activity,
} from 'lucide-react'
import { cn } from '@/utils'
import type { UserProfile } from '@/types'

interface ProfileStatsProps {
  profile: UserProfile
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  const stats = [
    {
      icon:  CheckSquare,
      label: 'Tasks assigned',
      value: profile.tasksAssigned,
      color: 'text-blue-400',
      bg:    'bg-blue-900/20',
    },
    {
      icon:  FolderKanban,
      label: 'Projects in org',
      value: profile.projectsCount,
      color: 'text-primary-400',
      bg:    'bg-primary-900/20',
    },
    {
      icon:  MessageSquare,
      label: 'Comments made',
      value: profile.commentsCount,
      color: 'text-purple-400',
      bg:    'bg-purple-900/20',
    },
    {
      icon:  Activity,
      label: 'Activity events',
      value: profile.activityCount,
      color: 'text-green-400',
      bg:    'bg-green-900/20',
    },
  ]

  return (
    <div className="card space-y-4">
      <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">
        Your Stats
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl',
              stat.bg,
            )}
          >
            <stat.icon className={cn('w-5 h-5 flex-shrink-0', stat.color)} />
            <div className="min-w-0">
              <p className={cn('text-xl font-bold leading-none', stat.color)}>
                {stat.value}
              </p>
              <p className="text-xs text-surface-500 mt-0.5 truncate">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
