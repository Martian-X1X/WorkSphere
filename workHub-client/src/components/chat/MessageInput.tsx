import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Send, Smile } from 'lucide-react'

import { cn } from '@/utils'
import type { Message } from '@/types/chat'
import { EmojiPickerPopover } from './EmojiPickerPopover'

interface MessageInputProps {
  onSend: (content: string, parentMessageId?: string) => void
  replyTo?: Message | null
  onCancelReply?: () => void
  disabled?: boolean
  placeholder?: string
  onKeyActivity?: () => void
  onStopTyping?: () => void
}

export function MessageInput({
  onSend,
  replyTo,
  onCancelReply,
  disabled,
  placeholder = 'Write a message...',
  onKeyActivity,
  onStopTyping,
}: MessageInputProps) {
  const [value, setValue] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (replyTo) inputRef.current?.focus()
  }, [replyTo])

  const submit = () => {
    const content = value.trim()
    if (!content || disabled) return
    onStopTyping?.()
    onSend(content, replyTo?.id)
    setValue('')
    setShowEmoji(false)
    onCancelReply?.()
    inputRef.current?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="relative border-t border-surface-800 bg-surface-900 px-4 py-3">
      {showEmoji && (
        <EmojiPickerPopover
          onSelect={(emoji) => {
            setValue((current) => current + emoji)
            onKeyActivity?.()
            setShowEmoji(false)
            inputRef.current?.focus()
          }}
          onClose={() => setShowEmoji(false)}
        />
      )}

      <div className="flex items-end gap-2 bg-surface-800 border border-surface-700
                      rounded-xl px-3 py-2 focus-within:border-primary-500/60">
        <button
          type="button"
          onClick={() => setShowEmoji((open) => !open)}
          className="p-1 text-surface-400 hover:text-surface-100 rounded transition-colors"
          title="Add emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value)
            if (e.target.value.trim()) onKeyActivity?.()
            else onStopTyping?.()
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex-1 resize-none bg-transparent text-sm text-surface-100',
            'placeholder:text-surface-500 outline-none max-h-32 py-1',
          )}
        />

        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-500
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[10px] text-surface-600 mt-1.5 px-1">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  )
}
