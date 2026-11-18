import { useNavigate } from 'react-router-dom'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { Calendar, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/utils'
import type { MyTask } from '@/types/analytics'

interface MyTasksPanelProps {
  tasks: MyTask[]
  loading?: boolean
}

const priorityDot: Record<string, string> = {
  Urgent: 'bg-red-500',
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-blue-500',
}

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = parseISO(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'MMM d')
}

export function MyTasksPanel({ tasks, loading }: MyTasksPanelProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="bg-surface-800/60 border border-surface-700/40 rounded-2xl p-5 animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-surface-700 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-surface-800/60 border border-surface-700/40 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-surface-100">My Tasks</h3>
          <p className="text-xs text-surface-500 mt-0.5">{tasks.length} pending</p>
        </div>
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-sm text-surface-400">All caught up!</p>
          <p className="text-xs text-surface-600 mt-0.5">No pending tasks.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.taskId}
              onClick={() => navigate(`/tasks/${task.taskId}`)}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-700/50 cursor-pointer transition-colors group border border-transparent hover:border-surface-700/60"
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                  priorityDot[task.priority] ?? 'bg-surface-500',
                )}
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm text-surface-200 truncate group-hover:text-surface-100 transition-colors">
                  {task.title}
                </p>
                <p className="text-xs text-surface-500 mt-0.5 truncate">
                  {task.projectName}
                </p>
              </div>

              {task.dueDate && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-[10px] font-medium flex-shrink-0 px-1.5 py-0.5 rounded-md',
                    task.isOverdue
                      ? 'text-red-400 bg-red-500/10'
                      : 'text-surface-500 bg-surface-700/60',
                  )}
                >
                  {task.isOverdue ? (
                    <AlertCircle className="w-3 h-3" />
                  ) : (
                    <Calendar className="w-3 h-3" />
                  )}
                  {formatDueDate(task.dueDate)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
