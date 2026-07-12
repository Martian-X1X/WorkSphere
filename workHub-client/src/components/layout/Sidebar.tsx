import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { NavItem } from './NavItem'
import { navSections } from './navConfig'
import { useLayout } from '@/hooks/useLayout'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils'

interface SidebarProps {
  onNavClick?: () => void  // for mobile
}

export function Sidebar({ onNavClick }: SidebarProps) {
  const { sidebarOpen, toggleSidebar } = useLayout()
  const { user, isAdminOrOwner } = useAuthStore()

  return (
    <aside
      className={cn(
        // Base
        'hidden lg:flex flex-col h-full',
        'bg-surface-950 border-r border-surface-800',
        'transition-all duration-200 ease-in-out flex-shrink-0',

        // Width based on open/collapsed state
        sidebarOpen ? 'w-56' : 'w-14'
      )}
    >
      {/* ── Logo + collapse button ────────────────────────── */}
      <div className={cn(
        'flex items-center h-16 px-3 border-b border-surface-800 flex-shrink-0',
        sidebarOpen ? 'justify-between' : 'justify-center'
      )}>
        {sidebarOpen && (
          <div className="flex items-center gap-2 min-w-0">
            <Logo size="sm" />
            <span className="font-semibold text-surface-50 text-sm truncate">
              WorkSphere
            </span>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className={cn(
            'p-1.5 rounded-lg text-surface-500 hover:text-surface-300',
            'hover:bg-surface-800 transition-colors flex-shrink-0'
          )}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen
            ? <ChevronLeft className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />
          }
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 px-2">
        {navSections.map((section, sectionIdx) => {
          // Filter items based on role
          const visibleItems = section.items.filter(
            item => !item.adminOnly || isAdminOrOwner()
          )

          if (visibleItems.length === 0) return null

          return (
            <div key={sectionIdx} className="space-y-0.5">
              {/* Section header */}
              {section.title && sidebarOpen && (
                <p className="text-[10px] font-semibold text-surface-600
                               uppercase tracking-widest px-3 pt-3 pb-1">
                  {section.title}
                </p>
              )}

              {/* Divider when collapsed */}
              {section.title && !sidebarOpen && sectionIdx > 0 && (
                <div className="border-t border-surface-800 my-2 mx-1" />
              )}

              {visibleItems.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  collapsed={!sidebarOpen}
                  onClick={onNavClick}
                />
              ))}
            </div>
          )
        })}
      </nav>

      {/* ── User footer ──────────────────────────────────── */}
      <div className={cn(
        'border-t border-surface-800 p-3 flex-shrink-0',
        !sidebarOpen && 'flex justify-center'
      )}>
        {sidebarOpen ? (
          <div className="flex items-center gap-2 min-w-0">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center
                            justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-surface-200 truncate">
                {user?.fullName}
              </p>
              <p className="text-[10px] text-surface-500 truncate">
                {user?.role}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center
                          justify-center">
            <span className="text-white text-xs font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}