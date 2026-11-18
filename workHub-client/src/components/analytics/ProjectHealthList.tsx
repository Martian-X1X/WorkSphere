import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/utils'
import type { ProjectHealth } from '@/types/analytics'

interface ProjectHealthListProps {
  projects: ProjectHealth[]
  loading?: boolean
}

const statusConfig = {
  OnTrack: {
    label: 'On Track',
    icon: CheckCircle2,
    class: 'text-green-400 bg-green-500/10',
  },
  AtRisk: {
    label: 'At Risk',
    icon: Clock,
    class: 'text-yellow-400 bg-yellow-500/10',
  },
  Behind: {
    label: 'Behind',
    icon: AlertTriangle,
    class: 'text-red-400 bg-red-500/10',
  },
}

export function ProjectHealthList({ projects, loading }: ProjectHealthListProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="bg-surface-800/60 border border-surface-700/40 rounded-2xl p-5 space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-surface-700 rounded w-3/4" />
            <div className="h-2 bg-surface-700 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-surface-800/60 border border-surface-700/40 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-surface-100">Project Health</h3>
          <p className="text-xs text-surface-500 mt-0.5">Active projects</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-surface-500 text-center py-8">No active projects</p>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => {
            const status = statusConfig[p.status] ?? statusConfig.OnTrack
            const StatusIcon = status.icon

            return (
              <div
                key={p.projectId}
                className="cursor-pointer group"
                onClick={() => navigate(`/projects/${p.projectId}`)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: p.color }}
                    />
                    <span className="text-sm text-surface-200 truncate group-hover:text-surface-100 transition-colors font-medium">
                      {p.projectName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span
                      className={cn(
                        'flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full',
                        status.class,
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    <span className="text-xs text-surface-500 tabular-nums">
                      {p.progress.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${p.progress}%`, background: p.color }}
                  />
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-surface-600">
                    {p.doneTasks}/{p.totalTasks} tasks
                  </span>
                  {p.overdueTasks > 0 && (
                    <span className="text-[10px] text-red-400">
                      {p.overdueTasks} overdue
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
