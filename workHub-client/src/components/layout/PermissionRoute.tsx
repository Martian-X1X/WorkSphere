import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from '@/components/ui/Spinner'
import ForbiddenPage from '@/pages/errors/ForbiddenPage'

interface PermissionRouteProps {
  children:   React.ReactNode
  permission?: string              // single permission required
  minRole?:   'Admin' | 'Owner'  // minimum role required
  redirect?:  boolean            // redirect instead of showing 403
}

// PermissionRoute — wraps a route and enforces permission at route level
// Place inside the protected route group in App.tsx
//
// Usage in App.tsx:
//   <Route path="/settings" element={
//     <PermissionRoute permission="organizations.update">
//       <SettingsPage />
//     </PermissionRoute>
//   } />
export function PermissionRoute({
  children,
  permission,
  minRole,
  redirect = false,
}: PermissionRouteProps) {
  const permissions     = useAuthStore((s) => s.permissions)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userRole        = useAuthStore((s) => s.user?.role)
  const location        = useLocation()

  // Permissions still loading — show spinner briefly
  if (isAuthenticated && permissions.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" label="Loading..." />
      </div>
    )
  }

  // Check permission
  let allowed = true

  if (permission) {
    allowed = permissions.includes(permission)
  } else if (minRole) {
    if (minRole === 'Owner') {
      allowed = userRole === 'Owner'
    } else if (minRole === 'Admin') {
      allowed = userRole === 'Owner' || userRole === 'Admin'
    }
  }

  if (!allowed) {
    // Option A: redirect to dashboard silently
    if (redirect) {
      return (
        <Navigate
          to="/dashboard"
          state={{ from: location.pathname, reason: 'permission_denied' }}
          replace
        />
      )
    }
    // Option B: show 403 page (default)
    return <ForbiddenPage inline={false} />
  }

  return <>{children}</>
}
