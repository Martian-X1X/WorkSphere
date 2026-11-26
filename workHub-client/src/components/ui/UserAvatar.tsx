import { Avatar } from './Avatar'
import { PresenceDot } from './PresenceDot'
import { cn } from '@/utils'

interface UserAvatarProps {
  userId: string
  name: string
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showPresence?: boolean
  className?: string
}

const sizeConfig = {
  xs: { avatar: 'w-6 h-6 text-[10px]', dot: 'sm' as const, dotPos: '-bottom-0.5 -right-0.5' },
  sm: { avatar: 'w-7 h-7 text-xs',     dot: 'sm' as const, dotPos: '-bottom-0.5 -right-0.5' },
  md: { avatar: 'w-9 h-9 text-sm',     dot: 'md' as const, dotPos: '-bottom-0.5 -right-0.5' },
  lg: { avatar: 'w-12 h-12 text-base', dot: 'lg' as const, dotPos: 'bottom-0 right-0' },
}

export function UserAvatar({
  userId,
  name,
  avatarUrl,
  size = 'md',
  showPresence = false,
  className,
}: UserAvatarProps) {
  const config = sizeConfig[size]
  const avatarSize = size === 'lg' ? 'lg' : size === 'md' ? 'md' : 'sm'

  return (
    <div className={cn('relative inline-flex flex-shrink-0', className)}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={cn(config.avatar, 'rounded-full object-cover flex-shrink-0')}
        />
      ) : (
        <Avatar name={name} size={avatarSize} className={config.avatar} />
      )}

      {showPresence && (
        <PresenceDot
          userId={userId}
          size={config.dot}
          className={cn('absolute', config.dotPos)}
        />
      )}
    </div>
  )
}
