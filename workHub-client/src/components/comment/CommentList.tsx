import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '@/hooks/useComments'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils'

// ── Skeleton ───────────────────────────────────────────────────────
function CommentSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-surface-700 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="h-3.5 w-24 bg-surface-700 rounded" />
              <div className="h-3.5 w-16 bg-surface-700/50 rounded" />
            </div>
            <div className="h-3.5 bg-surface-700/60 rounded w-full" />
            <div className="h-3.5 bg-surface-700/40 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface CommentListProps {
  taskId: string
}

export function CommentList({ taskId }: CommentListProps) {
  const { user } = useAuthStore()

  // ── Active edit state ────────────────────────────────────────────
  const [editingId,      setEditingId]      = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [deletingId,     setDeletingId]     = useState<string | null>(null)

  // ── Hooks ────────────────────────────────────────────────────────
  const {
    data:      comments,
    isLoading: commentsLoading,
  } = useComments(taskId)

  const createMutation = useCreateComment(taskId)
  const updateMutation = useUpdateComment(taskId)
  const deleteMutation = useDeleteComment(taskId)

  // ── Handlers ─────────────────────────────────────────────────────
  const handleCreate = async (content: string) => {
    await createMutation.mutateAsync(content)
  }

  const handleStartEdit = (commentId: string, content: string) => {
    setEditingId(commentId)
    setEditingContent(content)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingContent('')
  }

  const handleEdit = async (commentId: string, content: string) => {
    await updateMutation.mutateAsync({ commentId, content })
    setEditingId(null)
    setEditingContent('')
  }

  const handleDelete = (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return
    setDeletingId(commentId)
    deleteMutation.mutate(commentId, {
      onSettled: () => setDeletingId(null),
    })
  }

  const commentCount = comments?.length ?? 0

  return (
    <div className="space-y-6">

      {/* ── Comment count header ─────────────────────────────── */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-surface-500" />
        <h3 className="text-sm font-semibold text-surface-300">
          {commentsLoading
            ? 'Loading comments...'
            : commentCount === 0
            ? 'No comments yet'
            : `${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
        </h3>
      </div>

      {/* ── New Comment Form ─────────────────────────────────── */}
      {user && (
        <CommentForm
          onSubmit={handleCreate}
          isSubmitting={createMutation.isPending}
          placeholder="Write a comment... (Ctrl+Enter to submit)"
        />
      )}

      {/* ── Divider ──────────────────────────────────────────── */}
      {commentCount > 0 && (
        <div className="border-t border-surface-700/50" />
      )}

      {/* ── Comments list ────────────────────────────────────── */}
      {commentsLoading ? (
        <CommentSkeleton />
      ) : commentCount > 0 ? (
        <div className="space-y-5">
          {comments!.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              taskId={taskId}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isEditing={editingId === comment.id}
              isDeleting={deletingId === comment.id}
              isSubmitting={updateMutation.isPending}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="w-10 h-10 text-surface-700 mx-auto mb-3" />
          <p className="text-sm text-surface-500">
            No comments yet. Be the first to comment!
          </p>
        </div>
      )}
    </div>
  )
}