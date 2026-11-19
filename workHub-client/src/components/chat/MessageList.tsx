import { useEffect, useRef, useState } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { Loader2 } from 'lucide-react'

import { cn } from '@/utils'
import { sameDay } from '@/lib/chatUtils'
import type { Message } from '@/types/chat'
import { DateSeparator } from './DateSeparator'
import { MessageBubble } from './MessageBubble'

const FIRST_INDEX_BASE = 1_000_000

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
  onReply: (message: Message) => void
  onEdit: (messageId: string, content: string) => void
  onDelete: (messageId: string) => void
  onToggleReaction: (messageId: string, emoji: string) => void
}

export function MessageList({
  messages,
  currentUserId,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
  onToggleReaction,
}: MessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const [firstItemIndex, setFirstItemIndex] = useState(FIRST_INDEX_BASE)
  const previousMessages = useRef(messages)
  const atBottomRef = useRef(true)
  const lastIdRef = useRef<string | undefined>(messages[messages.length - 1]?.id)

  useEffect(() => {
    const previous = previousMessages.current
    const prepended = previous.length > 0
      && messages.length > previous.length
      && messages[0]?.id !== previous[0]?.id

    if (prepended) {
      setFirstItemIndex((current) => current - (messages.length - previous.length))
    }
    previousMessages.current = messages
  }, [messages])

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last || last.id === lastIdRef.current) return

    const shouldScroll = atBottomRef.current || !lastIdRef.current
    lastIdRef.current = last.id

    if (shouldScroll) {
      requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({
          index: firstItemIndex + messages.length - 1,
          behavior: 'smooth',
        })
      })
    }
  }, [firstItemIndex, messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm
                      text-surface-500 px-6 text-center">
        No messages yet. Say hello to start the conversation.
      </div>
    )
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      className="h-full flex-1"
      data={messages}
      firstItemIndex={firstItemIndex}
      computeItemKey={(_, message) => message.id}
      increaseViewportBy={200}
      atBottomStateChange={(atBottom) => { atBottomRef.current = atBottom }}
      components={{
        Header: () => hasMore ? (
          <div className="flex justify-center py-3">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs',
                'bg-surface-800 text-surface-300 hover:bg-surface-700',
                'disabled:opacity-60 transition-colors',
              )}
            >
              {isLoadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isLoadingMore ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        ) : null,
        Footer: () => <div className="h-4" />,
      }}
      itemContent={(index, message) => {
        const dataIndex = index - firstItemIndex
        const previous = dataIndex > 0 ? messages[dataIndex - 1] : undefined
        const showDate = !previous || !sameDay(previous.createdAt, message.createdAt)
        const showAvatar = !previous
          || previous.senderUserId !== message.senderUserId
          || !sameDay(previous.createdAt, message.createdAt)

        const parentMessage = message.parentMessageId
          ? messages.find((m) => m.id === message.parentMessageId)
          : undefined

        return (
          <div>
            {showDate && <DateSeparator date={message.createdAt} />}
            <MessageBubble
              message={message}
              isMine={message.senderUserId === currentUserId}
              showAvatar={showAvatar}
              parentMessage={parentMessage}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleReaction={onToggleReaction}
            />
          </div>
        )
      }}
    />
  )
}
