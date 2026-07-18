import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react'
import { getApiError } from '@/utils'

interface QueryErrorProps {
  error: unknown
  onRetry?: () => void
  title?: string
}

export function QueryError({
  error,
  onRetry,
  title = 'Failed to load data',
}: QueryErrorProps) {
  const axiosError = error as {
    response?: { status?: number }
    code?: string
  }

  const status  = axiosError?.response?.status
  const isOffline = axiosError?.code === 'ERR_NETWORK'

  const message = isOffline
    ? 'No internet connection. Check your network and try again.'
    : status === 404
    ? 'The resource you requested could not be found.'
    : status === 403
    ? 'You do not have permission to view this.'
    : getApiError(error)

  const Icon = isOffline ? WifiOff : AlertCircle

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
                       mb-4 border ${
        isOffline
          ? 'bg-surface-800 border-surface-700'
          : 'bg-red-900/20 border-red-800/50'
      }`}>
        <Icon className={`w-6 h-6 ${
          isOffline ? 'text-surface-500' : 'text-red-400'
        }`} />
      </div>

      <h3 className="text-base font-semibold text-surface-200 mb-1">
        {title}
      </h3>
      <p className="text-sm text-surface-500 max-w-xs mb-6">{message}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700/30
                     hover:bg-primary-700/50 border border-primary-700/50
                     rounded-lg text-sm text-primary-400 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      )}
    </div>
  )
}