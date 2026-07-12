import { NavLink } from 'react-router-dom'
import { cn } from '@/utils'
import type { NavItem as NavItemType } from './navConfig'

interface NavItemProps {
  item: NavItemType
  collapsed: boolean    // sidebar is in mini mode
  onClick?: () => void  // for mobile — close menu on click
}

export function NavItem({ item, collapsed, onClick }: NavItemProps) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          // Base styles
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
          'transition-all duration-150 relative group',

          // Active state
          isActive
            ? 'bg-primary-600/20 text-primary-400 font-medium'
            : 'text-surface-400 hover:text-surface-100 hover:bg-surface-700/50',

          // Collapsed mode — center the icon
          collapsed && 'justify-center px-2'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar */}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5
                             bg-primary-400 rounded-r-full" />
          )}

          {/* Icon */}
          <Icon
            className={cn(
              'flex-shrink-0 transition-colors',
              collapsed ? 'w-5 h-5' : 'w-4 h-4',
              isActive ? 'text-primary-400' : 'text-surface-500 group-hover:text-surface-300'
            )}
          />

          {/* Label — hidden when collapsed */}
          {!collapsed && (
            <span className="truncate">{item.label}</span>
          )}

          {/* Badge */}
          {!collapsed && item.badge && item.badge > 0 && (
            <span className="ml-auto bg-primary-600 text-white text-xs
                             font-medium px-1.5 py-0.5 rounded-full min-w-[18px]
                             text-center leading-none">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}

          {/* Tooltip when collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-surface-700
                            text-surface-100 text-xs rounded-md whitespace-nowrap
                            opacity-0 group-hover:opacity-100 transition-opacity
                            pointer-events-none z-50 shadow-lg border
                            border-surface-600">
              {item.label}
            </div>
          )}
        </>
      )}
    </NavLink>
  )
}