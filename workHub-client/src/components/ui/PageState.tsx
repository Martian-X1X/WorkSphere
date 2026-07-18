import { type ReactNode } from 'react'
import { Spinner } from './Spinner'
import { QueryError } from './QueryError'

interface PageStateProps {
  isLoading: boolean
  error?: unknown
  isEmpty?: boolean
  onRetry?: () => void
  loadingLabel?: string
  errorTitle?: string
  children: ReactNode
  emptyState?: ReactNode
  skeleton?: ReactNode
}

export function PageState({
  isLoading,
  error,
  isEmpty = false,
  onRetry,
  loadingLabel,
  errorTitle,
  children,
  emptyState,
  skeleton,
}: PageStateProps) {
  if (isLoading) {
    return skeleton ? (
      <>{skeleton}</>
    ) : (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" label={loadingLabel} />
      </div>
    )
  }

  if (error) {
    return <QueryError error={error} onRetry={onRetry} title={errorTitle} />
  }

  if (isEmpty && emptyState) {
    return <>{emptyState}</>
  }

  return <>{children}</>
}