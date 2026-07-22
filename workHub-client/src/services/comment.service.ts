import api from '@/lib/api'
import type {
  ApiResponse,
  PagedResult,
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
} from '@/types'

export const commentService = {
  // ── Get all comments for a task ─────────────────────────────────
  getComments: (taskId: string, page = 1, pageSize = 50) =>
    api.get<ApiResponse<PagedResult<Comment>>>(
      `/tasks/${taskId}/comments?page=${page}&pageSize=${pageSize}&sortDirection=asc`
    ),

  // ── Create comment ───────────────────────────────────────────────
  createComment: (taskId: string, data: CreateCommentRequest) =>
    api.post<ApiResponse<Comment>>(
      `/tasks/${taskId}/comments`,
      data
    ),

  // ── Edit comment ─────────────────────────────────────────────────
  updateComment: (
    taskId:    string,
    commentId: string,
    data:      UpdateCommentRequest
  ) =>
    api.put<ApiResponse<Comment>>(
      `/tasks/${taskId}/comments/${commentId}`,
      data
    ),

  // ── Delete comment ───────────────────────────────────────────────
  deleteComment: (taskId: string, commentId: string) =>
    api.delete<ApiResponse<object>>(
      `/tasks/${taskId}/comments/${commentId}`
    ),
}