import { cn } from '@/shared/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-4',
  }

  return (
    <div
      className={cn(
        'rounded-full border-surface-600 border-t-primary-500 animate-spin',
        sizes[size],
        className
      )}
    />
  )
}