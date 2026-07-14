import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { TaskStatusBadge } from '@/components/ui/TaskStatusBadge'
import { taskService } from '@/services/task.service'
import { getApiError, cn } from '@/utils'

const STATUSES = [
  'Todo', 'InProgress', 'InReview', 'Done', 'Cancelled',
] as const

interface StatusDropdownProps {
  taskId: string
  currentStatus: string
  projectId: string
  disabled?: boolean
}

export function StatusDropdown({
  taskId,
  currentStatus,
  projectId,
  disabled = false,
}: StatusDropdownProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: (status: string) => taskService.changeStatus(taskId, status),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success(`Status changed to ${newStatus}`)
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiError(error))
      setOpen(false)
    },
  })

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!disabled) setOpen(!open)
        }}
        disabled={disabled || mutation.isPending}
        className={cn(
          'flex items-center gap-1 transition-opacity',
          disabled ? 'opacity-50 cursor-default' : 'hover:opacity-80 cursor-pointer'
        )}
      >
        <TaskStatusBadge status={currentStatus} size="sm" />
        {!disabled && <ChevronDown className="w-3 h-3 text-surface-500" />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => { e.stopPropagation(); setOpen(false) }}
          />
          <div className="absolute right-0 top-7 w-36 bg-surface-800
                          border border-surface-700 rounded-xl shadow-xl
                          z-20 overflow-hidden animate-fade-in">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={(e) => {
                  e.stopPropagation()
                  if (s !== currentStatus) mutation.mutate(s)
                  else setOpen(false)
                }}
                className={cn(
                  'w-full px-3 py-2 flex items-center gap-2 text-left',
                  'transition-colors hover:bg-surface-700',
                  s === currentStatus
                    ? 'bg-surface-700/50'
                    : ''
                )}
              >
                <TaskStatusBadge status={s} size="sm" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}