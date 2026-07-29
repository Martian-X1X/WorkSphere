import { type ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'
import type { Permission } from '@/lib/permissions'

interface CanProps {
  children:    ReactNode
  fallback?:   ReactNode

  permission?: Permission | string
  permissions?: (Permission | string)[]
  allPermissions?: (Permission | string)[]
  role?: 'Owner' | 'Admin' | 'Member'
  minRole?: 'Admin' | 'Owner'
}

export function Can({
  children,
  fallback = null,
  permission,
  permissions,
  allPermissions,
  role,
  minRole,
}: CanProps) {
  const userPermissions = useAuthStore((state) => state.permissions)
  const userRole        = useAuthStore((state) => state.user?.role)

  let allowed = false

  if (permission) {
    allowed = userPermissions.includes(permission)
  } else if (permissions) {
    allowed = permissions.some((p) => userPermissions.includes(p))
  } else if (allPermissions) {
    allowed = allPermissions.every((p) => userPermissions.includes(p))
  } else if (role) {
    allowed = userRole === role
  } else if (minRole) {
    if (minRole === 'Admin') {
      allowed = userRole === 'Owner' || userRole === 'Admin'
    } else if (minRole === 'Owner') {
      allowed = userRole === 'Owner'
    }
  }

  return allowed ? <>{children}</> : <>{fallback}</>
}
