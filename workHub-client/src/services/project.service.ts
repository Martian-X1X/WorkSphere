import api from '@/lib/api'
import type {
  ApiResponse,
  PagedResult,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '@/types'

export interface ProjectQueryParams {
  status?: string
  search?: string
  sortBy?: string
  sortDirection?: string
  page?: number
  pageSize?: number
}

export const projectService = {
  // ── List ────────────────────────────────────────────────────────
  getProjects: (params: ProjectQueryParams = {}) => {
    const query = new URLSearchParams()
    if (params.status)        query.set('status', params.status)
    if (params.search)        query.set('search', params.search)
    if (params.sortBy)        query.set('sortBy', params.sortBy)
    if (params.sortDirection) query.set('sortDirection', params.sortDirection)
    if (params.page)          query.set('page', String(params.page))
    if (params.pageSize)      query.set('pageSize', String(params.pageSize))
    return api.get<ApiResponse<PagedResult<Project>>>(
      `/projects?${query.toString()}`
    )
  },

  getProjectById: (id: string) =>
    api.get<ApiResponse<Project>>(`/projects/${id}`),

  // ── Mutations ───────────────────────────────────────────────────
  createProject: (data: CreateProjectRequest) =>
    api.post<ApiResponse<Project>>('/projects', data),

  updateProject: (id: string, data: UpdateProjectRequest) =>
    api.put<ApiResponse<Project>>(`/projects/${id}`, data),

  changeStatus: (id: string, status: string) =>
    api.patch<ApiResponse<Project>>(`/projects/${id}/status`, { status }),

  deleteProject: (id: string) =>
    api.delete<ApiResponse<object>>(`/projects/${id}`),
}