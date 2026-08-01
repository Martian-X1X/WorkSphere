import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileMenu } from './MobileMenu'
import { Spinner } from '@/components/ui/Spinner'
import { useLayout } from '@/hooks/useLayout'
import { useAuthContext } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'

export function AppLayout() {
  const { isLoading } = useAuthContext()  // loads + syncs permissions
  const permissions   = useAuthStore((s) => s.permissions)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { mobileMenuOpen, setMobileMenuOpen } = useLayout()

  const location = useLocation()

  // Show "Access Denied" toast when redirected due to missing permission
  useEffect(() => {
    const state = location.state as { reason?: string } | null
    if (state?.reason === 'permission_denied') {
      toast.error('You do not have permission to access that page.', {
        id: 'permission-denied',
      })
      // Clear the state so toast doesn't repeat on refresh
      window.history.replaceState({}, '')
    }
  }, [location])

  // Show brief spinner while permissions load on first visit
  // After first load, permissions are persisted in Zustand
  const permissionsLoading = isAuthenticated &&
                             permissions.length === 0 &&
                             isLoading

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">

      {/* ── Desktop sidebar (always rendered, collapses) ──── */}
      <Sidebar />

      {/* ── Mobile drawer (rendered on demand) ─────────────── */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* ── Main area — header + scrollable content ─────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Sticky header */}
        <Header />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-auto">
          {permissionsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner size="lg" label="Loading your workspace..." />
            </div>
          ) : (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full animate-fade-in">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
