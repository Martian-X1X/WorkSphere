import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user:          User | null
  accessToken:   string | null
  refreshToken:  string | null
  permissions:   string[]

  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setPermissions: (permissions: string[]) => void
  logout: () => void

  hasPermission:  (permission: string) => boolean
  isOwner:        () => boolean
  isAdminOrOwner: () => boolean
  isMember:       () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      permissions:  [],

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ user, accessToken, refreshToken })
      },

      setPermissions: (permissions) => set({ permissions }),

      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null, refreshToken: null, permissions: [] })
      },

      hasPermission: (permission) => {
        const { permissions } = get()
        return permissions.includes(permission)
      },

      isOwner: () => get().user?.role === 'Owner',

      isAdminOrOwner: () => {
        const role = get().user?.role
        return role === 'Owner' || role === 'Admin'
      },

      isMember: () => get().user?.role === 'Member',
    }),
    {
      name: 'worksphere-auth',
      partialize: (state) => ({
        user:        state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        permissions: state.permissions,
      }),
    }
  )
)