import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  // ── State ──────────────────────────────────────────────────
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  permissions: string[] | null
  isAuthenticated: boolean

  // ── Actions ────────────────────────────────────────────────
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setPermissions: (permissions: string[]) => void
  logout: () => void

  // ── Permission helpers ─────────────────────────────────────
  hasPermission: (permission: string) => boolean
  isOwner: () => boolean
  isAdminOrOwner: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        // Also sync to localStorage for axios interceptor
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })
      },

      setPermissions: (permissions) => set({ permissions }),

      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          permissions: null,
          isAuthenticated: false,
        })
      },

      hasPermission: (permission) => {
        const { permissions } = get()
        return permissions?.includes(permission) ?? false
      },

      isOwner: () => get().user?.role === 'Owner',

      isAdminOrOwner: () => {
        const role = get().user?.role
        return role === 'Owner' || role === 'Admin'
      },
    }),
    {
      name: 'worksphere-auth',
      // Only persist these fields
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)