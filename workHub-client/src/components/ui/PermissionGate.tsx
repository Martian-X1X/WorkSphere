import { type ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from './Spinner'
import ForbiddenPage from '@/pages/errors/ForbiddenPage'

interface PermissionGateProps {
  permission: string
  children:   ReactNode
  fallback?:  ReactNode        // custom fallback instead of 403 page
  inline?:    boolean          // use inline 403 instead of full page
  loading?:   ReactNode        // custom loading state
}

// PermissionGate — combines loading + permission check
// Use this for FULL PAGE sections that require a permission.
// For UI elements (buttons), use <Can> instead.
export function PermissionGate({
  permission,
  children,
  fallback,
  inline = true,
  loading,
}: PermissionGateProps) {
  const permissions     = useAuthStore((s) => s.permissions)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // Still loading permissions (not yet fetched from API)
  if (isAuthenticated && permissions.length === 0) {
    return loading ? (
      <>{loading}</>
    ) : (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" label="Checking permissions..." />
      </div>
    )
  }

  // Permission denied
  if (!permissions.includes(permission)) {
    if (fallback) return <>{fallback}</>
    return <ForbiddenPage inline={inline} />
  }

  return <>{children}</>
}
