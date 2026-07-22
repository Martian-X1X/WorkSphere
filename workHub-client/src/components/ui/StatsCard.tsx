import { type LucideIcon } from 'lucide-react'
import { cn } from '@/utils'

interface StatsCardProps {
  icon:       LucideIcon
  label:      string
  value:      number | string
  color?:     string
  bgColor?:   string
  loading?:   boolean
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  color    = 'text-surface-300',
  bgColor  = 'bg-surface-800/50',
  loading  = false,
}: StatsCardProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl border border-surface-700/50',
      bgColor,
    )}>
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
        'bg-surface-700/50',
      )}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div className="min-w-0">
        {loading ? (
          <div className="space-y-1 animate-pulse">
            <div className="h-5 w-8 bg-surface-700 rounded" />
            <div className="h-3 w-16 bg-surface-700/50 rounded" />
          </div>
        ) : (
          <>
            <p className={cn('text-lg font-bold leading-none', color)}>
              {value}
            </p>
            <p className="text-xs text-surface-500 mt-0.5">{label}</p>
          </>
        )}
      </div>
    </div>
  )
}