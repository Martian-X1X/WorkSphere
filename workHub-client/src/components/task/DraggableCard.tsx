import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { KanbanCard } from './KanbanCard'
import { cn } from '@/utils'
import type { Task } from '@/types'

interface DraggableCardProps {
  task:      Task
  projectId: string
  onEdit:    (task: Task) => void
  isDragging?: boolean   // true when THIS card is being dragged
}

export function DraggableCard({
  task,
  projectId,
  onEdit,
  isDragging = false,
}: DraggableCardProps) {
  const {
    attributes,    // aria attributes for accessibility
    listeners,     // mouse/touch/keyboard event handlers
    setNodeRef,    // attach to DOM element
    transform,     // current drag transform (x, y offset)
    active,        // currently dragging something?
  } = useDraggable({
    id:   task.id,           // unique drag ID
    data: {
      task,                  // pass task data to DragOverlay
      type: 'task',          // helps us filter in onDragEnd
    },
  })

  // Transform the card's position while dragging
  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}    // drag event listeners (mousedown, touchstart...)
      {...attributes}   // aria-roledescription, aria-grabbed etc.
      className={cn(
        'touch-none',             // prevent browser touch scrolling while dragging
        isDragging && 'opacity-0' // hide original while ghost floats
      )}
    >
      <KanbanCard
        task={task}
        projectId={projectId}
        onEdit={onEdit}
      />
    </div>
  )
}