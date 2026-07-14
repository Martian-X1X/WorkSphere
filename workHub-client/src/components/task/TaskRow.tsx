import { Link } from 'react-router-dom'
import { Calendar, Clock, User, Layers } from 'lucide-react'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { StatusDropdown } from './StatusDropdown'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, formatMinutes, isOverdue, cn } from '@/utils'
import type { Task } from '@/types'

interface TaskRowProps {
  task: Task
  projectId: string
}

export function TaskRow({ task, projectId }: TaskRowProps) {
  const { isAdminOrOwner, user } = useAuthStore()
  const overdue = isOverdue(task.dueDate, task.status)

  // Member can only change status of their own tasks
  const canChangeStatus =
    isAdminOrOwner() || task.assignedToUserId === user?.id

  const isDone = task.status === 'Done'
  const isCancelled = task.status === 'Cancelled'

  return (
    <Link
      to={`/tasks/${task.id}`}
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl group',
        'hover:bg-surface-700/30 transition-colors',
        (isDone || isCancelled) && 'opacity-60'
      )}
    >
      {/* ── Status dropdown ────────────────────────────── */}
      <div
        className="mt-0.5 flex-shrink-0"
        onClick={(e) => e.preventDefault()}
      >
        <StatusDropdown
          taskId={task.id}
          currentStatus={task.status}
          projectId={projectId}
          disabled={!canChangeStatus}
        />
      </div>

      {/* ── Task info ───────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Title */}
        <p className={cn(
          'text-sm font-medium text-surface-100 group-hover:text-primary-400',
          'transition-colors truncate',
          isDone && 'line-through text-surface-400',
          isCancelled && 'line-through text-surface-500'
        )}>
          {task.title}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-surface-500">
          {/* Assignee */}
          {task.assignedToName ? (
            <div className="flex items-center gap-1">
              <Avatar name={task.assignedToName} size="sm" />
              <span className="hidden sm:inline truncate max-w-[80px]">
                {task.assignedToName.split(' ')[0]}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-surface-600">
              <User className="w-3 h-3" />
              <span className="hidden sm:inline">Unassigned</span>
            </div>
          )}

          {/* Due date */}
          {task.dueDate && (
            <div className={cn(
              'flex items-center gap-1',
              overdue ? 'text-red-400' : 'text-surface-500'
            )}>
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{overdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}</span>
            </div>
          )}

          {/* Estimated time */}
          {task.estimatedMinutes && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatMinutes(task.estimatedMinutes)}</span>
            </div>
          )}

          {/* Subtask count */}
          {task.subTaskCount > 0 && (
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>{task.subTaskCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Priority badge ──────────────────────────────── */}
      <div className="flex-shrink-0 mt-0.5">
        <PriorityBadge priority={task.priority} size="sm" />
      </div>
    </Link>
  )
}