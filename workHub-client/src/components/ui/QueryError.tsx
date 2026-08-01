import {
  AlertCircle,
  RefreshCw,
  WifiOff,
  Clock,
  ShieldX,
  Server,
} from 'lucide-react'
import { cn } from '@/utils'
import { classifyError } from '@/lib/errors'
import ForbiddenPage from '@/pages/errors/ForbiddenPage'

interface QueryErrorProps {
  error:   unknown
  onRetry?: () => void
  title?:  string
}

export function QueryError({
  error,
  onRetry,
  title = 'Failed to load data',
}: QueryErrorProps) {
  const classified = classifyError(error)

  // 403 → inline forbidden page
  if (classified.type === 'forbidden') {
    return (
      <ForbiddenPage
        inline
        message="You do not have permission to view this content."
      />
    )
  }

  // Icon per error type
  const iconMap = {
    network:     WifiOff,
    timeout:     Clock,
    server:      Server,
    unavailable: Server,
    forbidden:   ShieldX,
    default:     AlertCircle,
  } as const

  const IconComponent = iconMap[classified.type as keyof typeof iconMap]
                     ?? iconMap.default

  const isOffline = classified.type === 'network'

  return (
    <div className="flex flex-col items-center justify-center
                    py-16 text-center">
      <div className={cn(
        'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border',
        isOffline
          ? 'bg-surface-800 border-surface-700'
          : 'bg-red-900/20 border-red-800/50'
      )}>
        <IconComponent className={cn(
          'w-6 h-6',
          isOffline ? 'text-surface-500' : 'text-red-400'
        )} />
      </div>

      <h3 className="text-base font-semibold text-surface-200 mb-1">
        {title}
      </h3>
      <p className="text-sm text-surface-500 max-w-xs mb-2">
        {classified.message}
      </p>

      {/* Correlation ID for 500 errors */}
      {classified.correlationId && classified.type === 'server' && (
        <p className="text-xs text-surface-700 mb-4 font-mono">
          Error ID: {classified.correlationId}
        </p>
      )}

      {/* Retry button */}
      {onRetry && classified.canRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 mt-4
                     bg-primary-700/30 hover:bg-primary-700/50
                     border border-primary-700/50 rounded-lg
                     text-sm text-primary-400 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      )}
    </div>
  )
}
