import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileMenu } from './MobileMenu'
import { useLayout } from '@/hooks/useLayout'

export function AppLayout() {
  const { mobileMenuOpen, setMobileMenuOpen } = useLayout()

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
        <main className="flex-1 overflow-y-auto">
          {/* Page wrapper with consistent padding */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}