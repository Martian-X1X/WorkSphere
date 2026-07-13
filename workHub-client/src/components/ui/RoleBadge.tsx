import { cn } from '@/utils'

interface RoleBadgeProps {
  role: 'Owner' | 'Admin' | 'Member'
  size?: 'sm' | 'md'
}

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const styles = {
    Owner:  'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50',
    Admin:  'bg-blue-900/40 text-blue-400 border border-blue-800/50',
    Member: 'bg-surface-700 text-surface-400 border border-surface-600',
  }

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
  }

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      styles[role],
      sizes[size]
    )}>
      {role}
    </span>
  )
}