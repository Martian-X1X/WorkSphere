import { useState } from 'react'
import { Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { CommentForm } from './CommentForm'
import { useAuthStore } from '@/stores/authStore'
import { formatRelative, formatDateTime, cn } from '@/utils'
import type { Comment } from '@/types'

interface CommentItemProps {
  comment:  Comment
  taskId:   string
  onEdit:   (commentId: string, content: string) => Promise<void>
  onDelete: (commentId: string) => void
  isEditing:    boolean
  isDeleting:   boolean
  isSubmitting: boolean
  onStartEdit:  (commentId: string, content: string) => void
  onCancelEdit: () => void
}

export function CommentItem({
  comment,
  taskId,
  onEdit,
  onDelete,
  isEditing,
  isDeleting,
  isSubmitting,
  onStartEdit,
  onCancelEdit,
}: CommentItemProps) {
  const { isAdminOrOwner } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const canEdit   = comment.isOwnComment
  const canDelete = comment.isOwnComment || isAdminOrOwner()

  const handleEditSubmit = async (content: string) => {
    await onEdit(comment.id, content)
  }

  return (
    <div className={cn(
      'flex gap-3 group',
      isDeleting && 'opacity-40 pointer-events-none'
    )}>
      {/* ── Avatar ───────────────────────────────────────── */}
      <Avatar
        name={comment.createdByName}
        size="md"
        className="flex-shrink-0 mt-0.5"
      />

      {/* ── Content ──────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-surface-100">
              {comment.createdByName}
            </span>
            <span
              className="text-xs text-surface-500"
              title={formatDateTime(comment.createdAt)}
            >
              {formatRelative(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-[10px] text-surface-600 italic">
                (edited)
              </span>
            )}
          </div>

          {/* Actions menu */}
          {(canEdit || canDelete) && !isEditing && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={cn(
                  'p-1 rounded-lg text-surface-600 hover:text-surface-300',
                  'hover:bg-surface-700 transition-colors',
                  'opacity-0 group-hover:opacity-100',
                )}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-7 w-36 bg-surface-800
                                  border border-surface-700 rounded-xl shadow-xl
                                  z-20 overflow-hidden animate-fade-in">
                    {/* Edit — own comments only */}
                    {canEdit && (
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          onStartEdit(comment.id, comment.content)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5
                                   text-sm text-surface-300 hover:text-surface-100
                                   hover:bg-surface-700 transition-colors text-left"
                      >
                        <Pencil className="w-4 h-4 text-surface-500" />
                        Edit
                      </button>
                    )}

                    {/* Delete — own or Admin/Owner */}
                    {canDelete && (
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          onDelete(comment.id)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5
                                   text-sm text-red-400 hover:text-red-300
                                   hover:bg-red-900/20 transition-colors text-left"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Comment body — or edit form */}
        {isEditing ? (
          <CommentForm
            onSubmit={handleEditSubmit}
            isSubmitting={isSubmitting}
            initialValue={comment.content}
            onCancel={onCancelEdit}
            autoFocus
            compact
            placeholder="Edit your comment..."
          />
        ) : (
          <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  )
}