import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { DraggableCard } from './DraggableCard'
import { KanbanCardSkeleton } from './KanbanCardSkeleton'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils'
import { Plus } from 'lucide-react'
import type { KanbanColumnConfig } from './KanbanColumn'
import type { Task } from '@/types'


interface DroppableColumnProps {
  column:     KanbanColumnConfig
  tasks:      Task[]
  isLoading:  boolean
  projectId:  string
  onEdit:     (task: Task) => void
  onAddTask?: () => void
  activeId:   string | null    // ID of the card currently being dragged
}

export function DroppableColumn({
  column,
  tasks,
  isLoading,
  projectId,
  onEdit,
  onAddTask,
  activeId,
}: DroppableColumnProps) {
  const { isAdminOrOwner } = useAuthStore()

  const {
    setNodeRef,  // attach to the drop zone DOM element
    isOver,      // true when a draggable is hovering over this column
  } = useDroppable({
    id:   column.id,           // must match column status string
    data: { columnId: column.id },
  })

  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn(
      'flex flex-col rounded-2xl border min-w-[280px] w-[280px] flex-shrink-0',
      'transition-colors duration-150',
      column.bgColor,
      column.borderColor,
      // Highlight when a card is dragged over this column
      isOver && 'ring-2 ring-primary-500/50 border-primary-500/50',
    )}>
      {/* ── Column header ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-surface-700/50">
        <div className="flex items-center gap-2">
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
          <span className={cn(
            'text-xs font-semibold px-1.5 py-0.5 rounded-full',
            'bg-surface-700/60 min-w-[20px] text-center',
            column.color
          )}>
            {isLoading ? '…' : tasks.length}
          </span>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-surface-600 hover:text-surface-400
                     transition-colors rounded"
        >
          <span className="text-xs font-mono">
            {isCollapsed ? '▶' : '▼'}
          </span>
        </button>
      </div>

      {/* ── Drop zone body ────────────────────────────────── */}
      {!isCollapsed && (
        <div
          ref={setNodeRef}           // ← THIS is the drop zone
          className={cn(
            'flex-1 flex flex-col gap-2 p-3',
            'overflow-y-auto max-h-[calc(100vh-280px)]',
            'scrollbar-thin scrollbar-thumb-surface-700',
            'scrollbar-track-transparent',
            'min-h-[80px]',          // keep drop zone tall enough to drop on
            // Visual feedback when dragging over
            isOver && 'bg-primary-900/10 rounded-xl',
            'transition-colors duration-100',
          )}
        >
          {/* Skeleton cards during initial load */}
          {isLoading && Array.from({ length: 2 }).map((_, i) => (
            <KanbanCardSkeleton key={i} />
          ))}

          {/* Draggable cards */}
          {!isLoading && tasks.map((task) => (
            <DraggableCard
              key={task.id}
              task={task}
              projectId={projectId}
              onEdit={onEdit}
              isDragging={activeId === task.id}
            />
          ))}

          {/* Empty state */}
          {!isLoading && tasks.length === 0 && (
            <div className={cn(
              'flex flex-col items-center justify-center py-6 text-center',
              'rounded-xl border-2 border-dashed border-surface-700/50',
              isOver && 'border-primary-500/50 bg-primary-900/10',
              'transition-colors duration-100',
            )}>
              <p className="text-xs text-surface-600 italic">
                {isOver ? 'Drop here' : column.emptyLabel}
              </p>
            </div>
          )}

          {/* Add task button (Todo column only) */}
          {column.id === 'Todo' && isAdminOrOwner() && onAddTask && (
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
        </div>
      )}

      {isCollapsed && (
        <div className="px-4 py-2 text-xs text-surface-600 text-center">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} hidden
        </div>
      )}
    </div>
  )
}