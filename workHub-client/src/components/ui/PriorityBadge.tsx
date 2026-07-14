import { cn } from '@/utils'

type Priority = 'Low' | 'Medium' | 'High' | 'Urgent'

interface PriorityBadgeProps {
  priority: Priority | string
  size?: 'sm' | 'md'
}

const config: Record<string, { label: string; classes: string }> = {
  Low:    { label: 'Low',    classes: 'bg-surface-700 text-surface-400 border-surface-600' },
  Medium: { label: 'Medium', classes: 'bg-blue-900/40 text-blue-400 border-blue-800/50' },
  High:   { label: 'High',   classes: 'bg-orange-900/40 text-orange-400 border-orange-800/50' },
  Urgent: { label: 'Urgent', classes: 'bg-red-900/40 text-red-400 border-red-800/50' },
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const c = config[priority] ?? config.Medium
  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
  }
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium border',
      c.classes,
      sizes[size]
    )}>
      {c.label}
    </span>
  )
}