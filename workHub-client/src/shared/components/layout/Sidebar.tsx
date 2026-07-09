import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'
import { ROUTES } from '@/router/routes'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/shared/utils'

const navItems = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.PROJECTS, label: 'Projects', icon: FolderKanban },
  { to: ROUTES.TEAM, label: 'Team', icon: Users },
  { to: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const logout = useAuthStore((s) => s.logout)

  return (
    <aside className="w-64 bg-surface-800 border-r border-surface-700 flex flex-col shrink-0">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-surface-700">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">W</span>
        </div>
        <span className="font-semibold text-surface-50">WorkSphere</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === ROUTES.DASHBOARD}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-surface-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-surface-400 hover:text-red-400 hover:bg-surface-700 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  )
}
