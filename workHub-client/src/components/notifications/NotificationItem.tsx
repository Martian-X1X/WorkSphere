import { X } from 'lucide-react'
import { getNotificationConfig } from '@/lib/notificationConfig'
import { formatRelative, cn } from '@/utils'
import type { NotificationDto } from '@/services/notification.service'

interface NotificationItemProps {
  notification: NotificationDto
  onClick:      (n: NotificationDto) => void
  onDelete:     (id: string) => void
  isDeleting?:  boolean
}

export function NotificationItem({
  notification,
  onClick,
  onDelete,
  isDeleting = false,
}: NotificationItemProps) {
  const config = getNotificationConfig(notification.type)
  const Icon   = config.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 group cursor-pointer',
        'hover:bg-surface-700/30 transition-colors relative',
        !notification.isRead && 'bg-primary-900/5',
        isDeleting && 'opacity-40 pointer-events-none',
      )}
      onClick={() => onClick(notification)}
    >
      {/* ── Unread indicator ───────────────────────────── */}
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2">
        {!notification.isRead && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500
                           block flex-shrink-0" />
        )}
      </div>

      {/* ── Type icon ──────────────────────────────────── */}
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
        config.iconBg,
      )}>
        <Icon className={cn('w-4 h-4', config.iconColor)} />
      </div>

      {/* ── Content ────────────────────────────────────── */}
      <div className="flex-1 min-w-0 pr-6">
        <p className={cn(
          'text-sm leading-snug',
          notification.isRead
            ? 'text-surface-400'
            : 'text-surface-100 font-medium',
        )}>
          {notification.title}
        </p>
        <p className="text-xs text-surface-500 mt-0.5 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
        <p className="text-[10px] text-surface-600 mt-1">
          {formatRelative(notification.createdAt)}
        </p>
      </div>

      {/* ── Delete button (hover) ──────────────────────── */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(notification.id)
        }}
        className={cn(
          'absolute right-3 top-3',
          'p-1 rounded-lg text-surface-600',
          'hover:text-red-400 hover:bg-red-900/20',
          'transition-all opacity-0 group-hover:opacity-100',
        )}
        title="Delete notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
