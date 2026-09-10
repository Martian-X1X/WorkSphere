import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell, CheckCheck,
  ArrowRight, BellOff,
} from 'lucide-react'
import { NotificationItem }    from './NotificationItem'
import { NotificationSkeleton } from './NotificationSkeleton'
import {
  useNotificationFeed,
  useMarkAllAsRead,
  useDeleteNotification,
  useNotificationClick,
} from '@/hooks/useNotifications'
import { cn } from '@/utils'

interface NotificationDropdownProps {
  isOpen:  boolean
  onClose: () => void
}

export function NotificationDropdown({
  isOpen,
  onClose,
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ── Close on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, onClose])

  // ── Close on Escape ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // ── Data ───────────────────────────────────────────────────────
  const {
    data:      feed,
    isLoading,
    isFetching,
  } = useNotificationFeed(isOpen)   // only fetch when open

  const { mutate: markAllRead, isPending: markingAll }  = useMarkAllAsRead()
  const { mutate: deleteOne }                            = useDeleteNotification()
  const handleClick = useNotificationClick(onClose)

  const notifications = feed?.items      ?? []
  const unreadCount   = feed?.unreadCount ?? 0

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className={cn(
        'absolute right-0 top-full mt-2 z-50',
        'w-[380px] sm:w-[420px]',
        'bg-surface-900 border border-surface-700',
        'rounded-2xl shadow-2xl shadow-black/50',
        'overflow-hidden animate-fade-in',
        // Mobile: near full-width
        'max-w-[calc(100vw-32px)]',
      )}
    >
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between
                      px-4 py-3.5 border-b border-surface-700/60">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-surface-400" />
          <h3 className="text-sm font-semibold text-surface-100">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="text-xs font-semibold px-1.5 py-0.5
                             bg-primary-600/30 text-primary-400
                             border border-primary-700/50 rounded-full">
              {unreadCount} new
            </span>
          )}
          {isFetching && !isLoading && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400
                             animate-pulse" />
          )}
        </div>

        {/* Mark all read button */}
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            disabled={markingAll}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium',
              'text-surface-500 hover:text-primary-400',
              'transition-colors',
              markingAll && 'opacity-50 cursor-not-allowed',
            )}
            title="Mark all as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mark all read</span>
          </button>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────── */}
      <div className="max-h-[420px] overflow-y-auto scrollbar-thin
                      scrollbar-thumb-surface-700">

        {/* Loading skeleton */}
        {isLoading && <NotificationSkeleton />}

        {/* Notification list */}
        {!isLoading && notifications.length > 0 && (
          <div className="divide-y divide-surface-800/50">
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onClick={handleClick}
                onDelete={(id) => deleteOne(id)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center
                          py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-800
                            border border-surface-700 flex items-center
                            justify-center mb-3">
              <BellOff className="w-5 h-5 text-surface-600" />
            </div>
            <p className="text-sm font-medium text-surface-400">
              All caught up!
            </p>
            <p className="text-xs text-surface-600 mt-1">
              No notifications yet
            </p>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div className="border-t border-surface-700/60
                        px-4 py-3 bg-surface-900/50">
          <Link
            to="/notifications"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5
                       text-xs text-surface-500 hover:text-primary-400
                       transition-colors font-medium"
          >
            View all notifications
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
