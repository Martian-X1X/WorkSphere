import { useAuthStore } from '@/stores/authStore'
import { LogOut } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export default function Topbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="h-16 border-b border-surface-700 flex items-center justify-between px-6 bg-surface-800">
      <div>
        <h2 className="text-surface-50 text-lg font-semibold">
          {user?.organizationName ?? 'WorkSphere'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user?.firstName?.charAt(0) ?? 'U'}
            {user?.lastName?.charAt(0) ?? ''}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-surface-50">
              {user?.fullName ?? 'User'}
            </p>
            <p className="text-xs text-surface-400 capitalize">{user?.role?.toLowerCase() ?? ''}</p>
          </div>
          <button
            onClick={logout}
            className="text-surface-400 hover:text-red-400 transition-colors ml-2"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
