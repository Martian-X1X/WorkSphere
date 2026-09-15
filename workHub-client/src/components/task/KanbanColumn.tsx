import { useState } from 'react'
import { Plus } from 'lucide-react'
import { KanbanCard } from './KanbanCard'
import { KanbanCardSkeleton } from './KanbanCardSkeleton'
import { Can } from '@/components/ui/Can'
import { cn } from '@/utils'
import type { KanbanColumnConfig } from '@/lib/kanbanConfig'
import type { Task } from '@/types'

interface KanbanColumnProps {
  column:      KanbanColumnConfig
  tasks:       Task[]
  isLoading:   boolean
  projectId:   string
  onEdit:      (task: Task) => void
  onAddTask?:  () => void   // only shown on Todo column
}

export function KanbanColumn({
  column,
  tasks,
  isLoading,
  projectId,
  onEdit,
  onAddTask,
}: KanbanColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn(
      // Column container
      'flex flex-col rounded-2xl border min-w-[280px] max-w-[320px]',
      'w-[280px] flex-shrink-0',
      column.bgColor,
      column.borderColor,
    )}>
      {/* ── Column header ────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-surface-700/50">
        <div className="flex items-center gap-2">
          {/* Status dot */}
          <span className={cn(
            'w-2 h-2 rounded-full flex-shrink-0',
            column.id === 'Todo'       && 'bg-surface-500',
            column.id === 'InProgress' && 'bg-blue-400',
            column.id === 'InReview'   && 'bg-purple-400',
            column.id === 'Done'       && 'bg-green-400',
            column.id === 'Cancelled'  && 'bg-surface-700',
          )} />
          <h3 className="text-sm font-semibold text-surface-200">
            {column.label}
          </h3>
          {/* Task count badge */}
          <span className={cn(
            'text-xs font-semibold px-1.5 py-0.5 rounded-full',
            'bg-surface-700/60 min-w-[20px] text-center',
            column.color
          )}>
            {isLoading ? '…' : tasks.length}
          </span>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-surface-600 hover:text-surface-400
                     transition-colors rounded"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <span className="text-xs font-mono">
            {isCollapsed ? '▶' : '▼'}
          </span>
        </button>
      </div>

      {/* ── Column body ──────────────────────────────────── */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col gap-2 p-3
                        overflow-y-auto max-h-[calc(100vh-280px)]
                        scrollbar-thin scrollbar-thumb-surface-700
                        scrollbar-track-transparent">

          {/* Skeleton cards during load */}
          {isLoading && (
            Array.from({ length: 2 }).map((_, i) => (
              <KanbanCardSkeleton key={i} />
            ))
          )}

          {/* Task cards */}
          {!isLoading && tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              projectId={projectId}
              onEdit={onEdit}
            />
          ))}

          {/* Empty column state */}
          {!isLoading && tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center
                            py-8 text-center">
              <p className="text-xs text-surface-600 italic">
                {column.emptyLabel}
              </p>
            </div>
          )}

          {/* Add task button — only on Todo column */}
          <Can permission="tasks.create">
            {column.id === 'Todo' && onAddTask && (
              <button
                onClick={onAddTask}
                className="flex items-center gap-2 w-full px-3 py-2.5
                           text-sm text-surface-500 hover:text-surface-300
                           hover:bg-surface-700/50 rounded-xl border border-dashed
                           border-surface-700 hover:border-surface-600
                           transition-all mt-1"
              >
                <Plus className="w-4 h-4" />
                Add task
              </button>
            )}
          </Can>
        </div>
      )}

      {/* Collapsed state — show count only */}
      {isCollapsed && (
        <div className="px-4 py-2 text-xs text-surface-600 text-center">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} hidden
        </div>
      )}
    </div>
  )
}