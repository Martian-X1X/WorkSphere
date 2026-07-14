import { cn } from '@/utils'

type TaskStatus = 'Todo' | 'InProgress' | 'InReview' | 'Done' | 'Cancelled'

interface TaskStatusBadgeProps {
  status: TaskStatus | string
  size?: 'sm' | 'md'
}

const config: Record<string, { label: string; classes: string; dot: string }> = {
  Todo:      { label: 'Todo',        classes: 'bg-surface-700 text-surface-400 border-surface-600',        dot: 'bg-surface-500' },
  InProgress:{ label: 'In Progress', classes: 'bg-blue-900/40 text-blue-400 border-blue-800/50',           dot: 'bg-blue-400' },
  InReview:  { label: 'In Review',   classes: 'bg-purple-900/40 text-purple-400 border-purple-800/50',     dot: 'bg-purple-400' },
  Done:      { label: 'Done',        classes: 'bg-green-900/40 text-green-400 border-green-800/50',        dot: 'bg-green-400' },
  Cancelled: { label: 'Cancelled',   classes: 'bg-surface-700 text-surface-500 border-surface-600 line-through', dot: 'bg-surface-600' },
}

export function TaskStatusBadge({ status, size = 'md' }: TaskStatusBadgeProps) {
  const c = config[status] ?? config.Todo
  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
  }
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium border',
      c.classes,
      sizes[size]
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', c.dot)} />
      {c.label}
    </span>
  )
}