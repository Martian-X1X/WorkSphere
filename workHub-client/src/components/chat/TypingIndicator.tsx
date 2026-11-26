import { useMemo } from 'react'

import { useAuthStore } from '@/stores/authStore'
import { useTypingStore } from '@/stores/typingStore'

interface TypingIndicatorProps {
  roomId: string
}

export function TypingIndicator({ roomId }: TypingIndicatorProps) {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const typers = useTypingStore((s) => s.typing[roomId])

  const visibleTypers = useMemo(
    () => (typers ?? []).filter((t) => t.userId !== currentUserId),
    [typers, currentUserId],
  )

  if (visibleTypers.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 min-h-[28px]">
      <div className="flex items-center gap-0.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-surface-400 animate-typing-dot"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>

      <span className="text-[11px] italic text-surface-400 leading-none">
        {buildLabel(visibleTypers.map((t) => t.userName))}
      </span>
    </div>
  )
}

function buildLabel(names: string[]): string {
  if (names.length === 1) return `${firstName(names[0])} is typing…`
  if (names.length === 2) {
    return `${firstName(names[0])} and ${firstName(names[1])} are typing…`
  }
  return 'Several people are typing…'
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || 'Someone'
}
