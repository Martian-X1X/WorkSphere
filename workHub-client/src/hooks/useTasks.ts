import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { taskService, type TaskQueryParams } from '@/services/task.service'
import { queryKeys } from '@/lib/queryKeys'
import { getApiError } from '@/utils'

// ── useTasks ───────────────────────────────────────────────────────
export function useTasks(
  projectId: string | undefined,
  filters: Pick<TaskQueryParams, 'status' | 'priority' | 'search'> = {}
) {
  return useQuery({
    queryKey: queryKeys.tasks.byProjectFiltered(projectId ?? '', {
      status:   filters.status,
      priority: filters.priority,
      search:   filters.search,
    }),
    queryFn: () =>
      taskService.getTasksByProject(projectId!, {
        ...filters,
        pageSize: 100,
        sortBy: 'orderIndex',
        sortDirection: 'asc',
      }),
    enabled:   !!projectId,
    staleTime: 1000 * 30,
    select: (data) => data.data.data,
  })
}

// ── useTask ────────────────────────────────────────────────────────
export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(taskId ?? ''),
    queryFn:  () => taskService.getTaskById(taskId!),
    enabled:  !!taskId,
    staleTime: 1000 * 30,
    select: (data) => data.data.data,
  })
}

// ── useMyTasks ─────────────────────────────────────────────────────
export function useMyTasks(filters: {
  status?: string
  priority?: string
  overdue?: boolean
} = {}) {
  return useQuery({
    queryKey: queryKeys.tasks.myTasks(filters),
    queryFn:  () => taskService.getMyTasks(filters),
    staleTime: 1000 * 60,
    select: (data) => data.data.data,
  })
}

// ── useCreateTask ──────────────────────────────────────────────────
export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      title: string
      description?: string
      priority?: string
      assignedToUserId?: string
      dueDate?: string
      estimatedMinutes?: number
    }) => taskService.createTask(projectId, data),
    onSuccess: (res) => {
      // Invalidate all task queries for this project
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.byProject(projectId),
      })
      // Also invalidate project detail (task summary changes)
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })
      toast.success(`Task "${res.data.data.title}" created!`)
    },
    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useUpdateTask ──────────────────────────────────────────────────
export function useUpdateTask(taskId: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      title: string
      description?: string
      priority?: string
      assignedToUserId?: string | null
      dueDate?: string
      estimatedMinutes?: number
    }) => taskService.updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.byProject(projectId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.detail(taskId),
      })
      toast.success('Task updated')
    },
    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useChangeTaskStatus ────────────────────────────────────────────
// ✅ Optimistic update — status badge changes INSTANTLY
export function useChangeTaskStatus(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string
      status: string
    }) => taskService.changeStatus(taskId, status),

    // ✅ Optimistic: update cache before API responds
    onMutate: async ({ taskId, status }) => {
      // Cancel any outgoing refetches for this project's tasks
      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks.byProject(projectId),
      })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(
        queryKeys.tasks.byProject(projectId)
      )

      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.tasks.byProject(projectId) },
        (old: unknown) => {
          if (!old) return old
          const response = old as {
            data: { data: { items: Array<{ id: string; status: string }> } }
          }
          return {
            ...response,
            data: {
              ...response.data,
              data: {
                ...response.data.data,
                items: response.data.data.items.map((task) =>
                  task.id === taskId ? { ...task, status } : task
                ),
              },
            },
          }
        }
      )

      // Return snapshot for rollback
      return { previousTasks }
    },

    // If mutation fails, rollback to snapshot
    onError: (error, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          queryKeys.tasks.byProject(projectId),
          context.previousTasks
        )
      }
      toast.error(getApiError(error))
    },

    // Always refetch after success or failure to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.byProject(projectId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })
    },

    onSuccess: (_, { status }) => {
      toast.success(`Status changed to ${status}`)
    },
  })
}

// ── useDeleteTask ──────────────────────────────────────────────────
export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.byProject(projectId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })
      toast.success('Task deleted')
    },
    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useTaskActivity ────────────────────────────────────────────────
export function useTaskActivity(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.activity(taskId ?? ''),
    queryFn:  () => taskService.getTaskActivity(taskId!),
    enabled:  !!taskId,
    staleTime: 1000 * 30,
    select: (data) => data.data.data ?? [],
  })
}

// ── useTaskAssignees ───────────────────────────────────────────────
export function useTaskAssignees(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.assignees(taskId ?? ''),
    queryFn:  () => taskService.getTaskAssignees(taskId!),
    enabled:  !!taskId,
    staleTime: 1000 * 60,
    select: (data) => data.data.data ?? [],
  })
}