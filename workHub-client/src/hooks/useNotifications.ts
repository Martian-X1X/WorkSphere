import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { notificationService } from '@/services/notification.service'
import { queryKeys } from '@/lib/queryKeys'
import { getApiError } from '@/utils'

// ── useNotificationCount ───────────────────────────────────────────
// Polls every 30s — used by the bell badge.
// Lightweight: returns only { unreadCount, totalCount }
export function useNotificationCount() {
  return useQuery({
    queryKey:       queryKeys.notifications.count(),
    queryFn:        () => notificationService.getCount(),
    staleTime:      1000 * 25,           // 25s stale
    refetchInterval: 1000 * 30,          // poll every 30s
    select: (data) => data.data.data,
  })
}

// ── useNotificationFeed ────────────────────────────────────────────
// Loads when dropdown is opened.
export function useNotificationFeed(
  enabled    = true,
  unreadOnly = false
) {
  return useQuery({
    queryKey: queryKeys.notifications.feed(unreadOnly),
    queryFn:  () => notificationService.getFeed(1, 20, unreadOnly),
    enabled,
    staleTime: 1000 * 15,      // 15s — refresh more often in dropdown
    select: (data) => data.data.data,
  })
}

// ── useMarkAsRead ──────────────────────────────────────────────────
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(),
      })
    },
    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useMarkAllAsRead ───────────────────────────────────────────────
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(),
      })
      toast.success('All notifications marked as read')
    },
    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useDeleteNotification ──────────────────────────────────────────
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationService.deleteOne(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(),
      })
    },
    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useNotificationClick ───────────────────────────────────────────
// Handles click on a notification:
// 1. Mark as read (if unread)
// 2. Navigate to actionUrl
export function useNotificationClick(onClose: () => void) {
  const navigate      = useNavigate()
  const markAsRead    = useMarkAsRead()

  return (notification: {
    id:        string
    isRead:    boolean
    actionUrl: string | null
  }) => {
    // Mark as read if not already
    if (!notification.isRead) {
      markAsRead.mutate(notification.id)
    }

    // Navigate to the entity
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }

    onClose()
  }
}
