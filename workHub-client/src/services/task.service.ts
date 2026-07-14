import api from '@/lib/api'
import type { ApiResponse, PagedResult, Task } from '@/types'

export interface TaskQueryParams {
  status?: string
  priority?: string
  assignedToUserId?: string
  search?: string
  sortBy?: string
  sortDirection?: string
  page?: number
  pageSize?: number
}

export const taskService = {
  // ── Tasks in a project ──────────────────────────────────────────
  getTasksByProject: (projectId: string, params: TaskQueryParams = {}) => {
    const query = new URLSearchParams()
    if (params.status)          query.set('status', params.status)
    if (params.priority)        query.set('priority', params.priority)
    if (params.assignedToUserId)query.set('assignedToUserId', params.assignedToUserId)
    if (params.search)          query.set('search', params.search)
    if (params.sortBy)          query.set('sortBy', params.sortBy)
    if (params.sortDirection)   query.set('sortDirection', params.sortDirection)
    if (params.page)            query.set('page', String(params.page))
    if (params.pageSize)        query.set('pageSize', String(params.pageSize))
    return api.get<ApiResponse<PagedResult<Task>>>(
      `/projects/${projectId}/tasks?${query.toString()}`
    )
  },

  getTaskById: (taskId: string) =>
    api.get<ApiResponse<Task>>(`/tasks/${taskId}`),

  // ── Mutations ───────────────────────────────────────────────────
  createTask: (projectId: string, data: {
    title: string
    description?: string
    priority?: string
    dueDate?: string
    estimatedMinutes?: number
    assignedToUserId?: string
  }) => api.post<ApiResponse<Task>>(`/projects/${projectId}/tasks`, data),

  updateTask: (taskId: string, data: {
    title: string
    description?: string
    priority?: string
    dueDate?: string
    estimatedMinutes?: number
  }) => api.put<ApiResponse<Task>>(`/tasks/${taskId}`, data),

  changeStatus: (taskId: string, status: string, actualMinutes?: number) =>
    api.patch<ApiResponse<Task>>(`/tasks/${taskId}/status`, {
      status,
      ...(actualMinutes ? { actualMinutes } : {}),
    }),

  assignTask: (taskId: string, userId: string | null) =>
    api.patch<ApiResponse<Task>>(`/tasks/${taskId}/assign`, { userId }),

  deleteTask: (taskId: string) =>
    api.delete<ApiResponse<object>>(`/tasks/${taskId}`),

  // ── My Tasks ────────────────────────────────────────────────────
  getMyTasks: (params: { status?: string; priority?: string; overdue?: boolean } = {}) => {
    const query = new URLSearchParams()
    if (params.status)   query.set('status', params.status)
    if (params.priority) query.set('priority', params.priority)
    if (params.overdue)  query.set('overdue', 'true')
    return api.get<ApiResponse<PagedResult<Task>>>(
      `/users/me/tasks?${query.toString()}`
    )
  },
}