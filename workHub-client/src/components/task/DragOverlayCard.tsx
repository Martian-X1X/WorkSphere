import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Calendar } from 'lucide-react'
import { formatDate, cn } from '@/utils'
import type { Task } from '@/types'

interface DragOverlayCardProps {
  task: Task
}

export function DragOverlayCard({ task }: DragOverlayCardProps) {
  return (
    // Slightly scaled up + rotated for "picked up" feel
    <div className={cn(
      'bg-surface-800 border border-primary-500/50 rounded-xl p-3',
      'shadow-2xl shadow-black/50',
      'rotate-2 scale-105',          // tilt + scale = "lifted" effect
      'w-[272px]',                   // match column card width
      'cursor-grabbing',
      'opacity-95',
    )}>
      {/* Priority bar */}
      <div className={cn(
        'h-0.5 w-full rounded-full mb-3',
        task.priority === 'Urgent' ? 'bg-red-500' :
        task.priority === 'High'   ? 'bg-orange-500' :
        task.priority === 'Medium' ? 'bg-blue-500' :
        'bg-surface-600'
      )} />

      {/* Title */}
      <p className="text-sm font-medium text-surface-100 mb-2 leading-snug">
        {task.title}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-2
                      border-t border-surface-700/50">
        <div className="flex items-center gap-2">
          {task.assignedToName && (
            <Avatar name={task.assignedToName} size="sm" />
          )}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-[10px] text-surface-500">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>
        <PriorityBadge priority={task.priority} size="sm" />
      </div>
    </div>
  )
}