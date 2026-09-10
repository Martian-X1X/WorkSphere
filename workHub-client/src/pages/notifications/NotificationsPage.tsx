import { useState }          from 'react'
import { Bell, CheckCheck, RefreshCw } from 'lucide-react'
import { NotificationItem }  from '@/components/notifications/NotificationItem'
import { NotificationSkeleton } from '@/components/notifications/NotificationSkeleton'
import { QueryError }        from '@/components/ui/QueryError'
import { EmptyState }        from '@/components/ui/EmptyState'
import {
  useNotificationFeed,
  useMarkAllAsRead,
  useDeleteNotification,
  useNotificationClick,
} from '@/hooks/useNotifications'
import { cn } from '@/utils'

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false)

  const {
    data:      feed,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useNotificationFeed(true, unreadOnly)

  const { mutate: markAllRead,  isPending: markingAll } = useMarkAllAsRead()
  const { mutate: deleteOne }                            = useDeleteNotification()
  const handleClick = useNotificationClick(() => {})

  const notifications = feed?.items      ?? []
  const unreadCount   = feed?.unreadCount ?? 0
  const totalCount    = feed?.totalCount  ?? 0

  if (error) {
    return (
      <QueryError
        error={error}
        onRetry={refetch}
        title="Failed to load notifications"
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {isLoading
              ? 'Loading...'
              : `${totalCount} total · ${unreadCount} unread`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 border border-surface-700 rounded-lg
                       text-surface-500 hover:text-surface-300
                       hover:border-surface-600 bg-surface-800/50
                       transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn(
              'w-4 h-4',
              isFetching && 'animate-spin',
            )} />
          </button>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              disabled={markingAll}
              className="flex items-center gap-2 px-3 py-2 rounded-lg
                         border border-surface-700 bg-surface-800/50
                         text-sm text-surface-400 hover:text-surface-200
                         hover:border-surface-600 transition-colors
                         disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Filter tabs ─────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {[
          { label: 'All',    value: false },
          { label: 'Unread', value: true  },
        ].map((tab) => (
          <button
            key={String(tab.value)}
            onClick={() => setUnreadOnly(tab.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              unreadOnly === tab.value
                ? 'bg-primary-600/20 text-primary-400 border border-primary-700/50'
                : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800',
            )}
          >
            {tab.label}
            {tab.label === 'Unread' && unreadCount > 0 && (
              <span className="ml-1.5 text-xs bg-primary-700/50
                               text-primary-300 px-1.5 py-0.5
                               rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Notification list ────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <NotificationSkeleton />
        ) : notifications.length > 0 ? (
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
        ) : (
          <EmptyState
            icon={Bell}
            title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            description={
              unreadOnly
                ? 'Switch to "All" to see your notification history'
                : 'Notifications from tasks, comments and projects will appear here'
            }
            actionLabel={unreadOnly ? 'Show all' : undefined}
            onAction={unreadOnly ? () => setUnreadOnly(false) : undefined}
          />
        )}
      </div>
    </div>
  )
}
