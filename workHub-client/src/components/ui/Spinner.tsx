import { cn } from '@/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  label?: string
}

const sizes = {
  sm:  'w-4 h-4 border-2',
  md:  'w-6 h-6 border-2',
  lg:  'w-10 h-10 border-[3px]',
  xl:  'w-16 h-16 border-4',
}

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-label={label ?? 'Loading...'}
    >
      <div className={cn(
        'rounded-full border-surface-700 border-t-primary-500',
        'animate-spin',
        sizes[size]
      )} />
      {label && (
        <p className="text-sm text-surface-500 animate-pulse">{label}</p>
      )}
    </div>
  )
}