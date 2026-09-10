import api from '@/lib/api'
import type { ApiResponse } from '@/types'

// ── Types ──────────────────────────────────────────────────────────
export interface NotificationDto {
  id:            string
  type:          string
  title:         string
  message:       string
  entityType:    string | null
  entityId:      string | null
  actionUrl:     string | null
  createdByName: string | null
  isRead:        boolean
  readAt:        string | null
  createdAt:     string
  metadata:      string | null
}

export interface NotificationFeedDto {
  items:       NotificationDto[]
  unreadCount: number
  totalCount:  number
  hasMore:     boolean
}

export interface NotificationCountDto {
  unreadCount: number
  totalCount:  number
}

// ── Service ────────────────────────────────────────────────────────
export const notificationService = {
  getFeed: (page = 1, pageSize = 20, unreadOnly = false) =>
    api.get<ApiResponse<NotificationFeedDto>>(
      `/notifications?page=${page}&pageSize=${pageSize}&unreadOnly=${unreadOnly}`
    ),

  getCount: () =>
    api.get<ApiResponse<NotificationCountDto>>('/notifications/count'),

  markAsRead: (id: string) =>
    api.patch<ApiResponse<null>>(`/notifications/${id}/read`, {}),

  markAllAsRead: () =>
    api.patch<ApiResponse<null>>('/notifications/read-all', {}),

  deleteOne: (id: string) =>
    api.delete<ApiResponse<null>>(`/notifications/${id}`),

  deleteAll: () =>
    api.delete<ApiResponse<null>>('/notifications/all'),
}
