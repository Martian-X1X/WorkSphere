import { useAuthStore } from '@/stores/authStore'
import type { Permission } from '@/lib/permissions'

export function usePermission(permission: Permission | string): boolean {
  return useAuthStore((state) => state.permissions.includes(permission))
}

export function usePermissions(permissions: (Permission | string)[]): {
  has:    (p: Permission | string) => boolean
  hasAll: boolean
  hasAny: boolean
} {
  const userPermissions = useAuthStore((state) => state.permissions)

  return {
    has:    (p) => userPermissions.includes(p),
    hasAll: permissions.every((p) => userPermissions.includes(p)),
    hasAny: permissions.some((p)  => userPermissions.includes(p)),
  }
}

export function useRole() {
  const user = useAuthStore((state) => state.user)
  const role = user?.role ?? null

  return {
    role,
    isOwner:        role === 'Owner',
    isAdmin:        role === 'Admin',
    isMember:       role === 'Member',
    isAdminOrOwner: role === 'Owner' || role === 'Admin',
  }
}
