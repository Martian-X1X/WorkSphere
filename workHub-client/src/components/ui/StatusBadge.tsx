import { cn } from '@/utils'

type ProjectStatus = 'Active' | 'OnHold' | 'Completed' | 'Archived'

interface StatusBadgeProps {
  status: ProjectStatus | string
}

const config: Record<string, { label: string; classes: string }> = {
  Active:    { label: 'Active',    classes: 'bg-green-900/40 text-green-400 border-green-800/50' },
  OnHold:    { label: 'On Hold',   classes: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50' },
  Completed: { label: 'Completed', classes: 'bg-blue-900/40 text-blue-400 border-blue-800/50' },
  Archived:  { label: 'Archived',  classes: 'bg-surface-700 text-surface-500 border-surface-600' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status] ?? { label: status, classes: 'bg-surface-700 text-surface-400 border-surface-600' }
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      c.classes
    )}>
      {c.label}
    </span>
  )
}