import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Clock, User, Layers,
  MoreHorizontal, Pencil, Trash2,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { StatusDropdown } from './StatusDropdown'
import { Avatar } from '@/components/ui/Avatar'
import { taskService } from '@/services/task.service'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, formatMinutes, isOverdue, getApiError, cn } from '@/utils'
import type { Task } from '@/types'

interface TaskRowProps {
  task: Task
  projectId: string
  onEdit: (task: Task) => void
}

export function TaskRow({ task, projectId, onEdit }: TaskRowProps) {
  const { isAdminOrOwner, user } = useAuthStore()
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)

  const overdue = isOverdue(task.dueDate, task.status)
  const canChangeStatus =
    isAdminOrOwner() || task.assignedToUserId === user?.id
  const canManage = isAdminOrOwner()
  const isDone = task.status === 'Done'
  const isCancelled = task.status === 'Cancelled'

  const deleteMutation = useMutation({
    mutationFn: () => taskService.deleteTask(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success('Task deleted')
    },
    onError: (error) => toast.error(getApiError(error)),
  })

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl group relative',
        'hover:bg-surface-700/30 transition-colors',
        (isDone || isCancelled) && 'opacity-60'
      )}
    >
      {/* ── Status dropdown ──────────────────────────── */}
      <div className="mt-0.5 flex-shrink-0">
        <StatusDropdown
          taskId={task.id}
          currentStatus={task.status}
          projectId={projectId}
          disabled={!canChangeStatus}
        />
      </div>

      {/* ── Task info (clickable → detail page) ──────── */}
      <Link
        to={`/tasks/${task.id}`}
        className="flex-1 min-w-0 space-y-1.5"
      >
        <p className={cn(
          'text-sm font-medium text-surface-100 group-hover:text-primary-400',
          'transition-colors truncate',
          isDone && 'line-through text-surface-400',
          isCancelled && 'line-through text-surface-500'
        )}>
          {task.title}
        </p>

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

          {/* Estimate */}
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
              <span>{task.subTaskCount} sub</span>
            </div>
          )}
        </div>
      </Link>

      {/* ── Priority + Actions ───────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
        <PriorityBadge priority={task.priority} size="sm" />

        {/* Three-dot menu — Owner/Admin only */}
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
                'opacity-0 group-hover:opacity-100'
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