import { cn } from '@/utils'
import { usePresenceStore } from '@/stores/presenceStore'

interface PresenceDotProps {
  userId: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'w-2 h-2 ring-1',
  md: 'w-2.5 h-2.5 ring-2',
  lg: 'w-3 h-3 ring-2',
}

export function PresenceDot({ userId, size = 'md', className }: PresenceDotProps) {
  const isOnline = usePresenceStore((s) => s.onlineUserIds.has(userId))

  return (
    <span
      className={cn(
        'rounded-full flex-shrink-0 ring-surface-900',
        sizeMap[size],
        isOnline ? 'bg-green-500' : 'bg-surface-500',
        className,
      )}
      title={isOnline ? 'Online' : 'Offline'}
      aria-label={isOnline ? 'Online' : 'Offline'}
    />
  )
}
