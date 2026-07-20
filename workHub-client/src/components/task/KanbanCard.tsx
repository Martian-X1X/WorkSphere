import { Link } from 'react-router-dom'
import { Calendar, Clock, User, Layers } from 'lucide-react'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, isOverdue, formatMinutes, cn } from '@/utils'
import type { Task } from '@/types'

interface KanbanCardProps {
  task: Task
  projectId: string
  onEdit: (task: Task) => void
}

export function KanbanCard({ task, projectId, onEdit }: KanbanCardProps) {
  const { isAdminOrOwner, user } = useAuthStore()
  const overdue = isOverdue(task.dueDate, task.status)
  const isDone      = task.status === 'Done'
  const isCancelled = task.status === 'Cancelled'
  const canManage   = isAdminOrOwner()

  return (
    <div
      className={cn(
        // Base card styles
        'bg-surface-800 border border-surface-700 rounded-xl p-3',
        'shadow-sm hover:shadow-md hover:border-surface-600',
        'transition-all duration-150 cursor-pointer group',
        // Dim completed/cancelled cards
        (isDone || isCancelled) && 'opacity-60',
      )}
      // Day 48 will add drag attributes here
    >
      {/* ── Priority indicator bar ───────────────────────── */}
      <div className={cn(
        'h-0.5 w-full rounded-full mb-3',
        task.priority === 'Urgent' ? 'bg-red-500' :
        task.priority === 'High'   ? 'bg-orange-500' :
        task.priority === 'Medium' ? 'bg-blue-500' :
        'bg-surface-600'
      )} />

      {/* ── Title (link to detail page) ──────────────────── */}
      <Link
        to={`/tasks/${task.id}`}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'block text-sm font-medium text-surface-100 mb-2',
          'hover:text-primary-400 transition-colors leading-snug',
          isDone      && 'line-through text-surface-400',
          isCancelled && 'line-through text-surface-500',
        )}
      >
        {task.title}
      </Link>

      {/* ── Description preview ──────────────────────────── */}
      {task.description && (
        <p className="text-xs text-surface-500 mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* ── Subtask progress ─────────────────────────────── */}
      {task.subTaskCount > 0 && (
        <div className="flex items-center gap-1 mb-2 text-xs text-surface-500">
          <Layers className="w-3 h-3" />
          <span>{task.subTaskCount} subtask{task.subTaskCount > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* ── Footer: meta + priority ──────────────────────── */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2
                      border-t border-surface-700/50">
        {/* Left: assignee + due date */}
        <div className="flex items-center gap-2 min-w-0">
          {task.assignedToName ? (
            <Avatar name={task.assignedToName} size="sm" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-surface-700 border
                            border-surface-600 border-dashed flex items-center
                            justify-center flex-shrink-0">
              <User className="w-3 h-3 text-surface-600" />
            </div>
          )}

          {task.dueDate && (
            <div className={cn(
              'flex items-center gap-1 text-[10px]',
              overdue ? 'text-red-400' : 'text-surface-500'
            )}>
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{formatDate(task.dueDate)}</span>
            </div>
          )}

          {task.estimatedMinutes && !task.dueDate && (
            <div className="flex items-center gap-1 text-[10px] text-surface-500">
              <Clock className="w-3 h-3" />
              <span>{formatMinutes(task.estimatedMinutes)}</span>
            </div>
          )}
        </div>

        {/* Right: priority + edit */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <PriorityBadge priority={task.priority} size="sm" />

          {canManage && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEdit(task)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded
                         text-surface-500 hover:text-surface-300
                         hover:bg-surface-700 transition-all"
              title="Edit task"
            >
              ✎
            </button>
          )}
        </div>
      </div>
    </div>
  )
}