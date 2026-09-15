import api from '@/lib/api'
import type {
  ApiResponse,
  NotificationFeedDto,
  NotificationCountDto,
} from '@/types'

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