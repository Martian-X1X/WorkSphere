import { useState, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { NotificationDropdown } from './NotificationDropdown'
import { useNotificationCount } from '@/hooks/useNotifications'
import { useNotificationStore } from '@/stores/notificationStore'
import { cn } from '@/utils'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const isConnected = useNotificationStore((s) => s.isConnected)

  const toggle = useCallback(() => setIsOpen((p) => !p), [])
  const close  = useCallback(() => setIsOpen(false), [])

  // ── Unread count (always polling) ─────────────────────────────
  const { data: countData } = useNotificationCount()
  const unreadCount = countData?.unreadCount ?? 0

  return (
    <div className="relative">
      {/* ── Bell button ─────────────────────────────────── */}
      <button
        onClick={toggle}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className={cn(
          'relative p-2 rounded-xl transition-colors',
          isOpen
            ? 'bg-surface-700 text-surface-100'
            : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800',
        )}
      >
        <Bell className="w-5 h-5" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5',
            'min-w-[18px] h-[18px] px-1',
            'bg-red-500 text-white text-[10px] font-bold',
            'rounded-full flex items-center justify-center',
            'border-2 border-surface-900',
            'animate-fade-in',
          )}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Live connection dot */}
        <span
          className={cn(
            'absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full',
            'border border-surface-900',
            isConnected ? 'bg-green-500' : 'bg-surface-600',
          )}
          title={isConnected ? 'Live updates on' : 'Live updates offline'}
        />
      </button>

      {/* ── Dropdown ────────────────────────────────────── */}
      <NotificationDropdown isOpen={isOpen} onClose={close} />
    </div>
  )
}
