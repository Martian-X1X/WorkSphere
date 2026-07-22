import { useState, useRef, useEffect } from 'react'
import { Send, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils'

interface CommentFormProps {
  onSubmit:      (content: string) => Promise<void>
  isSubmitting:  boolean
  placeholder?:  string
  initialValue?: string
  onCancel?:     () => void
  autoFocus?:    boolean
  compact?:      boolean   // smaller version for inline editing
}

export function CommentForm({
  onSubmit,
  isSubmitting,
  placeholder = 'Write a comment...',
  initialValue = '',
  onCancel,
  autoFocus = false,
  compact = false,
}: CommentFormProps) {
  const { user } = useAuthStore()
  const [content, setContent]   = useState(initialValue)
  const [focused, setFocused]   = useState(autoFocus)
  const textareaRef             = useRef<HTMLTextAreaElement>(null)

  // Auto-focus when compact mode opens
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  // Auto-expand textarea as user types
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    // Reset height then set to scrollHeight
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed) return
    await onSubmit(trimmed)
    setContent('')
    setFocused(false)
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    // Escape to cancel
    if (e.key === 'Escape' && onCancel) {
      onCancel()
    }
  }

  const canSubmit = content.trim().length > 0 && !isSubmitting

  return (
    <div className={cn(
      'flex gap-3',
      compact ? 'flex-col' : ''
    )}>
      {/* Avatar — only shown in non-compact mode */}
      {!compact && user && (
        <Avatar name={user.fullName ?? user.email} size="md" className="flex-shrink-0 mt-0.5" />
      )}

      <div className="flex-1 space-y-2">
        {/* Textarea */}
        <div className={cn(
          'rounded-xl border transition-colors',
          focused
            ? 'border-primary-600/50 ring-1 ring-primary-600/30'
            : 'border-surface-700',
          'bg-surface-800/50',
        )}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => !content && setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={compact ? 3 : (focused ? 3 : 2)}
            className={cn(
              'w-full bg-transparent px-4 pt-3 pb-2',
              'text-sm text-surface-100 placeholder:text-surface-600',
              'resize-none outline-none',
              'min-h-[80px] max-h-[300px]',
              'transition-all duration-150',
            )}
          />

          {/* Submit/Cancel row — shown when focused or has content */}
          {(focused || content) && (
            <div className="flex items-center justify-between px-3 pb-3">
              <p className="text-[10px] text-surface-600">
                Ctrl+Enter to submit · Esc to cancel
              </p>
              <div className="flex items-center gap-2">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="flex items-center gap-1.5 px-3 py-1.5
                               text-xs text-surface-500 hover:text-surface-300
                               hover:bg-surface-700 rounded-lg transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                    'text-xs font-medium transition-all',
                    canSubmit
                      ? 'bg-primary-600 hover:bg-primary-500 text-white'
                      : 'bg-surface-700 text-surface-500 cursor-not-allowed',
                  )}
                >
                  <Send className="w-3 h-3" />
                  {isSubmitting ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}