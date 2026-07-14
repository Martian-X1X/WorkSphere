import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { taskService } from '@/services/task.service'
import { TaskStatusBadge } from '@/components/ui/TaskStatusBadge'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { formatDate, formatMinutes } from '@/utils'

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getTaskById(taskId!),
    enabled: !!taskId,
  })

  const task = data?.data.data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="text-center py-24">
        <p className="text-surface-500">Task not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Back */}
      <Link
        to={`/projects/${task.projectId}`}
        className="inline-flex items-center gap-1.5 text-sm text-surface-500
                   hover:text-surface-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {task.projectName}
      </Link>

      {/* Task header */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-surface-50">{task.title}</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PriorityBadge priority={task.priority} />
            <TaskStatusBadge status={task.status} />
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-surface-400 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2
                        border-t border-surface-700/50">
          {[
            { label: 'Project',   value: task.projectName },
            { label: 'Assigned',  value: task.assignedToName ?? 'Unassigned' },
            { label: 'Created',   value: `${task.createdByName}` },
            { label: 'Due Date',  value: formatDate(task.dueDate) },
            { label: 'Estimate',  value: formatMinutes(task.estimatedMinutes) },
            { label: 'Actual',    value: formatMinutes(task.actualMinutes) },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-surface-600">{item.label}</p>
              <p className="text-sm text-surface-200 font-medium mt-0.5">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder for Day 49-50 */}
      <div className="card text-center py-10 text-surface-600 text-sm">
        Comments + Full details — Day 49 & 50
      </div>
    </div>
  )
}