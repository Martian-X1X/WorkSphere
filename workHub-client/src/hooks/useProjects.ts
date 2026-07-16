import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { projectService, type ProjectQueryParams } from '@/services/project.service'
import { queryKeys } from '@/lib/queryKeys'
import { getApiError } from '@/utils'
import type { CreateProjectRequest, UpdateProjectRequest } from '@/types'

// ── useProjects ────────────────────────────────────────────────────
export function useProjects(filters: ProjectQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.projects.list({
      status:        filters.status,
      search:        filters.search,
      sortBy:        filters.sortBy,
      sortDirection: filters.sortDirection,
    }),
    queryFn: () => projectService.getProjects({ ...filters, pageSize: 100 }),
    staleTime: 1000 * 60,
    select: (data) => data.data.data,
  })
}

// ── useProject ─────────────────────────────────────────────────────
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? ''),
    queryFn:  () => projectService.getProjectById(projectId!),
    enabled:  !!projectId,
    staleTime: 1000 * 30,
    select: (data) => data.data.data,
  })
}

// ── useCreateProject ───────────────────────────────────────────────
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProjectRequest) =>
      projectService.createProject(data),
    onSuccess: (res) => {
      // Invalidate all project lists so new project appears
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
      toast.success(`Project "${res.data.data.name}" created!`)
    },
    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useUpdateProject ───────────────────────────────────────────────
export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProjectRequest) =>
      projectService.updateProject(projectId, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
      toast.success(`Project "${res.data.data.name}" updated!`)
    },
    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useChangeProjectStatus ─────────────────────────────────────────
export function useChangeProjectStatus(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (status: string) =>
      projectService.changeStatus(projectId, status),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
      toast.success(`Project status changed to ${newStatus}`)
    },
    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useDeleteProject ───────────────────────────────────────────────
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) => projectService.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
      toast.success('Project deleted')
    },
    onError: (error) => toast.error(getApiError(error)),
  })
}