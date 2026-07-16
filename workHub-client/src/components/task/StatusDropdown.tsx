import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { TaskStatusBadge } from '@/components/ui/TaskStatusBadge'
import { useChangeTaskStatus } from '@/hooks/useTasks'
import { cn } from '@/utils'

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
  const [open, setOpen] = useState(false)
  const { mutate: changeStatus, isPending } = useChangeTaskStatus(projectId)

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!disabled && !isPending) setOpen(!open)
        }}
        disabled={disabled || isPending}
        className={cn(
          'flex items-center gap-1 transition-opacity',
          disabled ? 'opacity-50 cursor-default' : 'hover:opacity-80 cursor-pointer'
        )}
      >
        <TaskStatusBadge status={currentStatus} size="sm" />
        {!disabled && (
          <ChevronDown className={cn(
            'w-3 h-3 text-surface-500',
            isPending && 'animate-spin'
          )} />
        )}
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
                  if (s !== currentStatus) {
                    changeStatus({ taskId, status: s })
                  }
                  setOpen(false)
                }}
                className={cn(
                  'w-full px-3 py-2 flex items-center gap-2 text-left',
                  'transition-colors hover:bg-surface-700',
                  s === currentStatus && 'bg-surface-700/50'
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