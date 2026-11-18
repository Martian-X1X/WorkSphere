import { type LucideIcon } from 'lucide-react'
import { cn } from '@/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'primary' | 'green' | 'red' | 'yellow' | 'blue'
  loading?: boolean
}

const colorMap = {
  primary: 'bg-primary-500/15 text-primary-400',
  green: 'bg-green-500/15 text-green-400',
  red: 'bg-red-500/15 text-red-400',
  yellow: 'bg-yellow-500/15 text-yellow-400',
  blue: 'bg-blue-500/15 text-blue-400',
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
  loading,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-surface-800/60 border border-surface-700/40 rounded-2xl p-5 animate-pulse">
        <div className="h-4 w-24 bg-surface-700 rounded mb-3" />
        <div className="h-8 w-16 bg-surface-700 rounded mb-2" />
        <div className="h-3 w-20 bg-surface-700 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-surface-800/60 border border-surface-700/40 rounded-2xl p-5 hover:border-surface-600/60 transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              trend.value >= 0
                ? 'text-green-400 bg-green-500/10'
                : 'text-red-400 bg-red-500/10',
            )}
          >
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-bold text-surface-100 tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-sm font-medium text-surface-400">{title}</p>
        {subtitle && <p className="text-xs text-surface-600">{subtitle}</p>}
      </div>
    </div>
  )
}
