import { cn } from '@/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Deterministic color from name
function getColor(name: string): string {
  const colors = [
    'bg-blue-700', 'bg-purple-700', 'bg-green-700',
    'bg-orange-700', 'bg-pink-700', 'bg-teal-700',
    'bg-indigo-700', 'bg-red-700',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold',
      'text-white flex-shrink-0',
      getColor(name),
      sizes[size],
      className
    )}>
      {getInitials(name)}
    </div>
  )
}