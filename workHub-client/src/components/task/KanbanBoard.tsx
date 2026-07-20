import { KanbanColumn, KANBAN_COLUMNS } from './KanbanColumn'
import type { Task } from '@/types'

interface KanbanBoardProps {
  tasks:      Task[]
  isLoading:  boolean
  projectId:  string
  onEdit:     (task: Task) => void
  onAddTask:  () => void
}

export function KanbanBoard({
  tasks,
  isLoading,
  projectId,
  onEdit,
  onAddTask,
}: KanbanBoardProps) {
  // ── Group tasks by status ──────────────────────────────────────
  const tasksByStatus = KANBAN_COLUMNS.reduce<Record<string, Task[]>>(
    (acc, col) => {
      acc[col.id] = tasks.filter(t => t.status === col.id)
      return acc
    },
    {}
  )

  return (
    // Horizontal scroll container
    <div className="flex gap-4 overflow-x-auto pb-4
                    scrollbar-thin scrollbar-thumb-surface-700
                    scrollbar-track-transparent">
      {KANBAN_COLUMNS.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          tasks={tasksByStatus[column.id] ?? []}
          isLoading={isLoading}
          projectId={projectId}
          onEdit={onEdit}
          onAddTask={column.id === 'Todo' ? onAddTask : undefined}
        />
      ))}
    </div>
  )
}