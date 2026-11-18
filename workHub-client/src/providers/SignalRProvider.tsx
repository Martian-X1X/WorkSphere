import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { HubConnectionState } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Bell } from 'lucide-react'

import {
  createHubConnection,
  disconnectHub,
  getStoredAccessToken,
} from '@/lib/signalr'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { notificationService } from '@/services/notification.service'
import { queryKeys } from '@/lib/queryKeys'
import type { NotificationDto } from '@/types'

const IMPORTANT_TYPES = new Set([
  'TaskAssigned',
  'CommentMention',
  'MemberJoined',
  'InviteAccepted',
])

/**
 * Owns the SignalR connection lifecycle. Mount once inside the auth +
 * router boundaries; it connects when authenticated and disconnects on
 * logout.
 */
export function SignalRProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const setConnected = useNotificationStore((s) => s.setConnected)

  const activeUserRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      void disconnectHub()
      activeUserRef.current = null
      setConnected(false)
      return
    }

    // Already connected for this user (e.g. React StrictMode remount).
    if (activeUserRef.current === userId) return

    const connect = async () => {
      if (activeUserRef.current && activeUserRef.current !== userId) {
        await disconnectHub()
      }

      activeUserRef.current = userId

      const hub = createHubConnection(getStoredAccessToken)

      hub.on('NewNotification', (notification: NotificationDto) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.all(),
        })

        if (IMPORTANT_TYPES.has(notification.type)) {
          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible ? 'animate-fade-in' : 'opacity-0'
                } max-w-sm w-full bg-surface-800 border border-surface-700/50
                  shadow-xl rounded-2xl p-4 flex items-start gap-3 cursor-pointer`}
                onClick={() => {
                  toast.dismiss(t.id)
                  if (notification.actionUrl) {
                    navigate(notification.actionUrl)
                  }
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl bg-primary-500/20 flex
                              items-center justify-center flex-shrink-0"
                >
                  <Bell className="w-4 h-4 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-100 truncate">
                    {notification.title}
                  </p>
                  <p className="text-xs text-surface-400 mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
              </div>
            ),
            { duration: 5000 },
          )
        }
      })

      hub.on('UnreadCountChanged', () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.count(),
        })
      })

      hub.on('NotificationRead', () => {
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.notifications.all(), 'feed'],
        })
      })

      hub.on('AllNotificationsRead', () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.all(),
        })
      })

      hub.onreconnecting(() => {
        setConnected(false)
        console.warn('[SignalR] Reconnecting…')
      })

      hub.onreconnected(() => {
        setConnected(true)
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.all(),
        })
      })

      hub.onclose((error) => {
        setConnected(false)
        if (error) {
          console.error('[SignalR] Connection closed with error:', error)
        }
      })

      try {
        if (hub.state === HubConnectionState.Disconnected) {
          await hub.start()
        }

        // User may have logged out while the connection was starting.
        const stillAuthenticated =
          useAuthStore.getState().isAuthenticated &&
          useAuthStore.getState().user?.id === userId

        if (!stillAuthenticated) {
          await disconnectHub()
          activeUserRef.current = null
          return
        }

        setConnected(true)
        console.info('[SignalR] Connected to NotificationHub')

        // Sync the current unread count immediately after connecting.
        try {
          const count = await notificationService.getCount()
          queryClient.setQueryData(
            queryKeys.notifications.count(),
            count,
          )
        } catch {
          // Non-critical — the bell will poll as a fallback.
        }
      } catch (err) {
        console.error('[SignalR] Failed to connect:', err)
        setConnected(false)
        activeUserRef.current = null
      }
    }

    void connect()

    // Intentionally no cleanup: the connection is a singleton guarded by
    // activeUserRef, and logout is handled by the branch above.
  }, [
    isAuthenticated,
    userId,
    navigate,
    queryClient,
    setConnected,
  ])

  return <>{children}</>
}
