import { Menu, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { UserMenu } from './UserMenu'
import { useLayout } from '@/hooks/useLayout'

// ── Map paths to breadcrumb labels ────────────────────────────────
const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects':  'Projects',
  '/tasks':     'My Tasks',
  '/members':   'Members',
  '/activity':  'Activity',
  '/settings':  'Settings',
  '/profile':   'Profile',
}

export function Header() {
  const location = useLocation()
  const { setMobileMenuOpen } = useLayout()

  // Build breadcrumb from current path
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const currentPage  = breadcrumbMap[`/${pathSegments[0]}`] ?? 'WorkSphere'

  return (
    <header className="h-16 bg-surface-950 border-b border-surface-800
                       flex items-center justify-between px-4 sm:px-6
                       flex-shrink-0 sticky top-0 z-30">

      {/* ── Left — mobile hamburger + breadcrumb ─────────── */}
      <div className="flex items-center gap-3">

        {/* Hamburger (mobile only) */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-1.5 text-surface-500 hover:text-surface-300
                     hover:bg-surface-800 rounded-lg transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-surface-500 hidden sm:inline">WorkSphere</span>
          {pathSegments.length > 0 && (
            <>
              <span className="text-surface-700 hidden sm:inline">/</span>
              <span className="font-medium text-surface-100">{currentPage}</span>
            </>
          )}
          {/* Sub-page breadcrumb */}
          {pathSegments.length > 1 && (
            <>
              <span className="text-surface-700">/</span>
              <span className="text-surface-400 capitalize truncate max-w-[200px]">
                {pathSegments[1]}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Right — notifications + user menu ────────────── */}
      <div className="flex items-center gap-1 sm:gap-2">

        {/* Notifications bell (placeholder for future) */}
        <button
          className="relative p-1.5 text-surface-500 hover:text-surface-300
                     hover:bg-surface-800 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {/* Notification dot */}
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary-500
                           rounded-full" />
        </button>

        {/* User avatar + dropdown */}
        <UserMenu />
      </div>
    </header>
  )
}