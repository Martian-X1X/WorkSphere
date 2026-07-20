import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { DroppableColumn } from './DroppableColumn'
import { DragOverlayCard } from './DragOverlayCard'
import { KANBAN_COLUMNS } from './KanbanColumn'
import { taskService } from '@/services/task.service'
import { queryKeys } from '@/lib/queryKeys'
import { getApiError } from '@/utils'
import type { Task, TaskStatus } from '@/types'

interface KanbanBoardProps {
  tasks:     Task[]
  isLoading: boolean
  projectId: string
  onEdit:    (task: Task) => void
  onAddTask: () => void
}

export function KanbanBoard({
  tasks,
  isLoading,
  projectId,
  onEdit,
  onAddTask,
}: KanbanBoardProps) {
  const queryClient = useQueryClient()

  // ── Local optimistic task state ──────────────────────────────
  // We maintain a LOCAL copy of tasks so we can move them
  // instantly without waiting for the API to respond.
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeId,   setActiveId]   = useState<string | null>(null)

  // Sync local state when server data changes
  // (e.g. after another mutation invalidates the query)
  const serverTasksKey = tasks.map(t => `${t.id}:${t.status}`).join(',')
  useState(() => {
    setLocalTasks(tasks)
  })

  // Keep localTasks in sync with tasks prop
  // We use a ref pattern to avoid stale closure issues
  if (!activeId) {
    // Only sync when not dragging (don't interrupt active drag)
    const localKey = localTasks.map(t => `${t.id}:${t.status}`).join(',')
    if (localKey !== serverTasksKey) {
      setLocalTasks(tasks)
    }
  }

  // ── Sensors ──────────────────────────────────────────────────
  // PointerSensor: requires 8px movement before drag starts
  // (prevents accidental drags on click)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,           // px — must move 8px to start dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ── Group tasks by status ────────────────────────────────────
  const tasksByStatus = KANBAN_COLUMNS.reduce<Record<string, Task[]>>(
    (acc, col) => {
      acc[col.id] = localTasks.filter(t => t.status === col.id)
      return acc
    },
    {}
  )

  // ── Drag handlers ────────────────────────────────────────────

  // Called when drag STARTS — record which card is being dragged
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const task = localTasks.find(t => t.id === active.id)
    if (task) {
      setActiveTask(task)
      setActiveId(String(active.id))
    }
  }, [localTasks])

  // Called while dragging OVER a column (real-time feedback)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over || !active) return

    const activeTaskId  = String(active.id)
    const overColumnId  = String(over.id)

    // Is the 'over' target a column? (not another card)
    const isOverColumn = KANBAN_COLUMNS.some(c => c.id === overColumnId)
    if (!isOverColumn) return

    const activeTask = localTasks.find(t => t.id === activeTaskId)
    if (!activeTask || activeTask.status === overColumnId) return

    // Optimistically move the card to the new column in local state
    setLocalTasks(prev =>
    prev.map(t =>
        t.id === activeTaskId
        ? { ...t, status: overColumnId as TaskStatus }
        : t
    )
    )
  }, [localTasks])

  // Called when drag ENDS — commit or revert
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveTask(null)
    setActiveId(null)

    if (!over) {
      // Dropped outside any column — revert to server state
      setLocalTasks(tasks)
      return
    }

    const activeTaskId = String(active.id)
    const overColumnId = String(over.id)

    // Find what the task's status was BEFORE the drag
    const originalTask = tasks.find(t => t.id === activeTaskId)
    if (!originalTask) return

    // No column change — nothing to do
    if (originalTask.status === overColumnId) return

    // Verify dropped on a valid column
    const isValidColumn = KANBAN_COLUMNS.some(c => c.id === overColumnId)
    if (!isValidColumn) {
      setLocalTasks(tasks)
      return
    }

    // ── Optimistic state is already applied (from handleDragOver)
    // Now call the API in the background
    try {
      await taskService.changeStatus(activeTaskId, overColumnId)

      // Success — invalidate to sync with server
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.byProject(projectId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })

      toast.success(
        `Moved to ${
          KANBAN_COLUMNS.find(c => c.id === overColumnId)?.label ?? overColumnId
        }`
      )
    } catch (error) {
      // Revert optimistic update on failure
      setLocalTasks(tasks)
      toast.error(getApiError(error))
    }
  }, [tasks, projectId, queryClient])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* ── Board: horizontal scroll ─────────────────────── */}
      <div className="flex gap-4 overflow-x-auto pb-6
                      scrollbar-thin scrollbar-thumb-surface-700
                      scrollbar-track-transparent">
        {KANBAN_COLUMNS.map((column) => (
          <DroppableColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id] ?? []}
            isLoading={isLoading}
            projectId={projectId}
            onEdit={onEdit}
            onAddTask={column.id === 'Todo' ? onAddTask : undefined}
            activeId={activeId}
          />
        ))}
      </div>

      {/* ── Drag Overlay: ghost card that follows cursor ─── */}
      <DragOverlay
        // Smooth drop animation
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeTask ? (
          <DragOverlayCard task={activeTask} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}