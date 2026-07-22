import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, ChevronDown } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { TaskStatusBadge } from '@/components/ui/TaskStatusBadge'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { useAuthStore } from '@/stores/authStore'
import { taskService } from '@/services/task.service'
import { queryKeys } from '@/lib/queryKeys'
import { getApiError, cn } from '@/utils'
import type { Task } from '@/types'

const STATUSES = [
  'Todo', 'InProgress', 'InReview', 'Done', 'Cancelled',
] as const

interface TaskActionsProps {
  task:   Task
  onEdit: () => void
}

export function TaskActions({ task, onEdit }: TaskActionsProps) {
  const { isAdminOrOwner, user } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate    = useNavigate()
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)

  const canEdit = isAdminOrOwner() || task.assignedToUserId === user?.id
  const canDelete = isAdminOrOwner()

  // ── Status mutation ──────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      taskService.changeStatus(task.id, status),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.detail(task.id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.byProject(task.projectId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.activity(task.id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(task.projectId),
      })
      toast.success(`Status changed to ${newStatus}`)
      setStatusMenuOpen(false)
    },
    onError: (error) => toast.error(getApiError(error)),
  })

  // ── Delete mutation ──────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => taskService.deleteTask(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.byProject(task.projectId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(task.projectId),
      })
      toast.success('Task deleted')
      navigate(`/projects/${task.projectId}`)
    },
    onError: (error) => toast.error(getApiError(error)),
  })

  const handleDelete = () => {
    if (window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* ── Status change dropdown ───────────────────────── */}
      {canEdit && (
        <div className="relative">
          <button
            onClick={() => setStatusMenuOpen(!statusMenuOpen)}
            disabled={statusMutation.isPending}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
              'border border-surface-700 bg-surface-800/50',
              'hover:border-surface-600 transition-colors',
              statusMutation.isPending && 'opacity-50 cursor-not-allowed'
            )}
          >
            <TaskStatusBadge status={task.status} size="sm" />
            <ChevronDown className={cn(
              'w-3.5 h-3.5 text-surface-500 transition-transform',
              statusMenuOpen && 'rotate-180'
            )} />
          </button>

          {statusMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setStatusMenuOpen(false)}
              />
              <div className="absolute left-0 top-10 w-40 bg-surface-800
                              border border-surface-700 rounded-xl shadow-xl
                              z-20 overflow-hidden animate-fade-in">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      if (s !== task.status) statusMutation.mutate(s)
                      else setStatusMenuOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5',
                      'text-sm text-left transition-colors hover:bg-surface-700',
                      s === task.status && 'bg-surface-700/50'
                    )}
                  >
                    <TaskStatusBadge status={s} size="sm" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Priority badge (display only) ─────────────────── */}
      <PriorityBadge priority={task.priority} />

      {/* ── Edit button ───────────────────────────────────── */}
      {canEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                     border border-surface-700 bg-surface-800/50 text-sm
                     text-surface-300 hover:text-surface-100
                     hover:border-surface-600 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      )}

      {/* ── Delete button ─────────────────────────────────── */}
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                     border border-red-900/50 bg-red-900/10 text-sm
                     text-red-400 hover:text-red-300 hover:bg-red-900/20
                     transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        </button>
      )}
    </div>
  )
}