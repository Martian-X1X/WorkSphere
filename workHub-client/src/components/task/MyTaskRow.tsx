import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Clock, FolderKanban,
  MoreHorizontal, Pencil, Trash2,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PriorityBadge }   from '@/components/ui/PriorityBadge'
import { StatusDropdown }  from './StatusDropdown'
import { taskService }     from '@/services/task.service'
import { queryKeys }       from '@/lib/queryKeys'
import { useAuthStore }    from '@/stores/authStore'
import { formatDate, formatMinutes, isOverdue, getApiError, cn } from '@/utils'
import type { Task } from '@/types'

interface MyTaskRowProps {
  task:   Task
  onEdit: (task: Task) => void
}

export function MyTaskRow({ task, onEdit }: MyTaskRowProps) {
  const { isAdminOrOwner, user } = useAuthStore()
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)

  const overdue     = isOverdue(task.dueDate, task.status)
  const isDone      = task.status === 'Done'
  const isCancelled = task.status === 'Cancelled'

  const canChangeStatus = isAdminOrOwner() ||
                          task.assignedToUserId === user?.id
  const canManage       = isAdminOrOwner()

  const deleteMutation = useMutation({
    mutationFn: () => taskService.deleteTask(task.id),
    onSuccess: () => {
      // Invalidate my tasks + project tasks
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(task.projectId),
      })
      toast.success('Task deleted')
    },
    onError: (error) => toast.error(getApiError(error)),
  })

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 rounded-xl group',
      'hover:bg-surface-700/30 transition-colors',
      (isDone || isCancelled) && 'opacity-60',
    )}>
      {/* ── Status dropdown ──────────────────────────────── */}
      <div className="mt-0.5 flex-shrink-0">
        <StatusDropdown
          taskId={task.id}
          currentStatus={task.status}
          projectId={task.projectId}
          disabled={!canChangeStatus}
        />
      </div>

      {/* ── Task info ────────────────────────────────────── */}
      <Link
        to={`/tasks/${task.id}`}
        className="flex-1 min-w-0 space-y-1.5"
      >
        {/* Title */}
        <p className={cn(
          'text-sm font-medium text-surface-100 truncate',
          'group-hover:text-primary-400 transition-colors',
          isDone      && 'line-through text-surface-400',
          isCancelled && 'line-through text-surface-500',
        )}>
          {task.title}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1
                        text-xs text-surface-500">
          {/* Project link */}
          <div className="flex items-center gap-1">
            <FolderKanban className="w-3 h-3 text-surface-600" />
            <span
              className="text-surface-500 hover:text-primary-400
                         transition-colors truncate max-w-[120px]"
              onClick={(e) => {
                e.preventDefault()
                window.location.href = `/projects/${task.projectId}`
              }}
            >
              {task.projectName}
            </span>
          </div>

          {/* Due date */}
          {task.dueDate && (
            <div className={cn(
              'flex items-center gap-1',
              overdue ? 'text-red-400' : 'text-surface-500',
            )}>
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{overdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}</span>
            </div>
          )}

          {/* Estimate */}
          {task.estimatedMinutes && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatMinutes(task.estimatedMinutes)}</span>
            </div>
          )}
        </div>
      </Link>

      {/* ── Priority + actions ───────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
        <PriorityBadge priority={task.priority} size="sm" />

        {canManage && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className={cn(
                'p-1 text-surface-600 hover:text-surface-300',
                'hover:bg-surface-700 rounded-lg transition-colors',
                'opacity-0 group-hover:opacity-100',
              )}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                  }}
                />
                <div className="absolute right-0 top-7 w-36 bg-surface-800
                                border border-surface-700 rounded-xl shadow-xl
                                z-20 overflow-hidden animate-fade-in">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setMenuOpen(false)
                      onEdit(task)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5
                               text-sm text-surface-300 hover:text-surface-100
                               hover:bg-surface-700 transition-colors text-left"
                  >
                    <Pencil className="w-4 h-4 text-surface-500" />
                    Edit task
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setMenuOpen(false)
                      if (window.confirm(`Delete "${task.title}"?`)) {
                        deleteMutation.mutate()
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5
                               text-sm text-red-400 hover:text-red-300
                               hover:bg-red-900/20 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}