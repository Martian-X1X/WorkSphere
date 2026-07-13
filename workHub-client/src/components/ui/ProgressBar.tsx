import { cn } from '@/utils'

interface ProgressBarProps {
  value: number   // 0–100
  className?: string
  showLabel?: boolean
}

export function ProgressBar({ value, className, showLabel = false }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  const color =
    clamped === 100 ? 'bg-green-500' :
    clamped >= 50   ? 'bg-primary-500' :
    clamped > 0     ? 'bg-primary-600' :
    'bg-surface-700'

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-surface-500">
          <span>Progress</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', color)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}