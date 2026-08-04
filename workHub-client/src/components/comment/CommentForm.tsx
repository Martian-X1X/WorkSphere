import { useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/stores/authStore'
import { commentSchema, type CommentFormData } from '@/lib/schemas'
import { cn } from '@/utils'

interface CommentFormProps {
  onSubmit:     (content: string) => Promise<void>
  isSubmitting: boolean
  placeholder?: string
  initialValue?: string
  onCancel?:    () => void
  autoFocus?:   boolean
  compact?:     boolean
}

export function CommentForm({
  onSubmit,
  isSubmitting,
  placeholder  = 'Write a comment...',
  initialValue = '',
  onCancel,
  autoFocus    = false,
  compact      = false,
}: CommentFormProps) {
  const { user }    = useAuthStore()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<CommentFormData>({
    resolver:      zodResolver(commentSchema),
    mode:          'onChange',         // validate immediately for comment UX
    defaultValues: { content: initialValue },
  })

  const content = useWatch({ control, name: 'content' }) ?? ''
  const MAX     = 4000

  // Auto-focus
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  // Reset textarea height after content is cleared
  useEffect(() => {
    if (content === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [content])

  // Auto-expand textarea
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.height = 'auto'
    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`
  }

  const onFormSubmit = async (data: CommentFormData) => {
    await onSubmit(data.content.trim())
    reset({ content: '' })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(onFormSubmit)()
    }
    if (e.key === 'Escape' && onCancel) {
      onCancel()
    }
  }

  const { ref: rhfRef, ...rest } = register('content')

  const isNearMax = content.length > MAX * 0.85
  const isAtMax   = content.length >= MAX

  return (
    <div className={cn('flex gap-3', compact && 'flex-col')}>
      {/* Avatar — non-compact only */}
      {!compact && user && (
        <Avatar
          name={user.fullName ?? user.email}
          size="md"
          className="flex-shrink-0 mt-0.5"
        />
      )}

      <div className="flex-1 space-y-1.5">
        <div className={cn(
          'rounded-xl border transition-colors',
          content
            ? 'border-primary-600/50 ring-1 ring-primary-600/30'
            : 'border-surface-700',
          errors.content && 'border-red-500/50',
          'bg-surface-800/50',
        )}>
          <textarea
            ref={(el) => {
              rhfRef(el)
              textareaRef.current = el
            }}
            placeholder={placeholder}
            rows={compact ? 3 : 2}
            maxLength={MAX}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full bg-transparent px-4 pt-3 pb-2',
              'text-sm text-surface-100 placeholder:text-surface-600',
              'resize-none outline-none',
              'min-h-[80px] max-h-[300px]',
            )}
            {...rest}
          />

          {/* Footer row */}
          {content && (
            <div className="flex items-center justify-between px-3 pb-3">
              {/* Character count */}
              <span className={cn(
                'text-[10px]',
                isAtMax   ? 'text-red-400'    :
                isNearMax ? 'text-yellow-400' :
                'text-surface-600'
              )}>
                {content.length}/{MAX}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-surface-600 hidden sm:inline">
                  Ctrl+Enter to submit
                </span>
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs
                               text-surface-500 hover:text-surface-300
                               hover:bg-surface-700 rounded-lg transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSubmit(onFormSubmit)}
                  disabled={!isValid || isSubmitting}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                    'text-xs font-medium transition-all',
                    isValid && !isSubmitting
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

        {/* Validation error */}
        {errors.content && (
          <p className="text-xs text-red-400 animate-fade-in">
            ⚠ {errors.content.message}
          </p>
        )}
      </div>
    </div>
  )
}
