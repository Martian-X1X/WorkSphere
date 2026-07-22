import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { commentService } from '@/services/comment.service'
import { queryKeys } from '@/lib/queryKeys'
import { getApiError } from '@/utils'

// ── useComments ────────────────────────────────────────────────────
export function useComments(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.comments.byTask(taskId ?? ''),
    queryFn:  () => commentService.getComments(taskId!),
    enabled:  !!taskId,
    staleTime: 1000 * 30,     // 30 seconds — comments change frequently
    select: (data) => data.data.data?.items ?? [],
  })
}

// ── useCreateComment ───────────────────────────────────────────────
export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) =>
      commentService.createComment(taskId, { content: content.trim() }),

    onSuccess: () => {
      // Invalidate comments to refetch latest
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byTask(taskId),
      })
      // Invalidate activity too — comment creates an activity entry
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.activity(taskId),
      })
    },

    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useUpdateComment ───────────────────────────────────────────────
export function useUpdateComment(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string
      content:   string
    }) =>
      commentService.updateComment(taskId, commentId, {
        content: content.trim(),
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byTask(taskId),
      })
      toast.success('Comment updated')
    },

    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useDeleteComment ───────────────────────────────────────────────
export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) =>
      commentService.deleteComment(taskId, commentId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byTask(taskId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.activity(taskId),
      })
      toast.success('Comment deleted')
    },

    onError: (error) => toast.error(getApiError(error)),
  })
}