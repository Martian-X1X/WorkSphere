import { useQuery } from '@tanstack/react-query'
import { activityService } from '@/services/activity.service'
import { queryKeys } from '@/lib/queryKeys'

// ── useOrgActivity ─────────────────────────────────────────────────
// Org-wide feed with auto-refresh every 30 seconds
export function useOrgActivity(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: queryKeys.activity.org(page),
    queryFn:  () => activityService.getOrgActivity({ page, pageSize }),
    staleTime: 1000 * 30,               // 30 seconds
    refetchInterval: 1000 * 30,         // auto-refresh every 30s
    select: (data) => data.data.data,   // unwrap ApiResponse → PagedResult
  })
}

// ── useProjectActivity ─────────────────────────────────────────────
export function useProjectActivity(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.activity.byProject(projectId ?? ''),
    queryFn:  () => activityService.getProjectActivity(projectId!),
    enabled:  !!projectId,
    staleTime: 1000 * 30,
    select: (data) => data.data.data ?? [],
  })
}

// ── useTaskActivity ────────────────────────────────────────────────
export function useTaskActivity(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.activity.byTask(taskId ?? ''),
    queryFn:  () => activityService.getTaskActivity(taskId!),
    enabled:  !!taskId,
    staleTime: 1000 * 30,
    select: (data) => data.data.data ?? [],
  })
}