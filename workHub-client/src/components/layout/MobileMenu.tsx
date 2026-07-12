import { X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { NavItem } from './NavItem'
import { navSections } from './navConfig'
import { useAuthStore } from '@/stores/authStore'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { isAdminOrOwner } = useAuthStore()

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-64 bg-surface-950 border-r
                      border-surface-800 z-50 lg:hidden flex flex-col
                      animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4
                        border-b border-surface-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-semibold text-surface-50">WorkSphere</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-surface-500 hover:text-surface-300
                       hover:bg-surface-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navSections.map((section, sectionIdx) => {
            const visibleItems = section.items.filter(
              item => !item.adminOnly || isAdminOrOwner()
            )
            if (visibleItems.length === 0) return null

            return (
              <div key={sectionIdx} className="space-y-0.5">
                {section.title && (
                  <p className="text-[10px] font-semibold text-surface-600
                                 uppercase tracking-widest px-3 pt-3 pb-1">
                    {section.title}
                  </p>
                )}
                {visibleItems.map((item) => (
                  <NavItem
                    key={item.path}
                    item={item}
                    collapsed={false}
                    onClick={onClose}
                  />
                ))}
              </div>
            )
          })}
        </nav>
      </div>
    </>
  )
}