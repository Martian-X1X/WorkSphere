import api from '@/lib/api'
import type { ApiResponse, PagedResult, ActivityLog } from '@/types'

export interface ActivityQueryParams {
  page?:     number
  pageSize?: number
}

export const activityService = {
  // ── Org-wide activity feed ───────────────────────────────────────
  getOrgActivity: (params: ActivityQueryParams = {}) => {
    const query = new URLSearchParams()
    if (params.page)     query.set('page',     String(params.page))
    if (params.pageSize) query.set('pageSize', String(params.pageSize))
    return api.get<ApiResponse<PagedResult<ActivityLog>>>(
      `/activity?${query.toString()}`
    )
  },

  // ── Project-level activity ───────────────────────────────────────
  getProjectActivity: (projectId: string) =>
    api.get<ApiResponse<ActivityLog[]>>(
      `/projects/${projectId}/activity`
    ),

  // ── Task-level activity ──────────────────────────────────────────
  getTaskActivity: (taskId: string) =>
    api.get<ApiResponse<ActivityLog[]>>(
      `/tasks/${taskId}/activity`
    ),
}