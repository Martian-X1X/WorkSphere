import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useActiveRoom, useDeleteMessage, useEditMessage, useLoadMoreMessages,
  useMarkRoomRead, useMessages, useSendMessage, useToggleReaction,
} from '@/hooks/useChat'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import type { Message } from '@/types/chat'
import { ChatHeader } from './ChatHeader'
import { MemberPanel } from './MemberPanel'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'
import { ReplyBanner } from './ReplyBanner'

interface ChatPanelProps {
  roomId: string
}

export function ChatPanel({ roomId }: ChatPanelProps) {
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')
  const room = useChatStore((s) => s.rooms.find((r) => r.id === roomId))

  const {
    messages, hasMore, cursor, isFetching,
  } = useMessages(roomId)
  const loadMore = useLoadMoreMessages(roomId)
  const sendMessage = useSendMessage(roomId)
  const editMessage = useEditMessage(roomId)
  const deleteMessage = useDeleteMessage(roomId)
  const toggleReaction = useToggleReaction(roomId)
  const markRead = useMarkRoomRead(roomId)

  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [membersOpen, setMembersOpen] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const lastMarkedRef = useRef<string | null>(null)

  useActiveRoom(roomId)

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last || last.id === lastMarkedRef.current) return
    lastMarkedRef.current = last.id
    void markRead()
  }, [messages, markRead])

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      await loadMore(cursor)
    } catch {
      toast.error('Failed to load older messages')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleSend = (content: string, parentMessageId?: string) => {
    sendMessage.mutate({ content, parentMessageId })
  }

  const handleEdit = (messageId: string, content: string) => {
    editMessage.mutate({ messageId, dto: { content } })
  }

  const handleDelete = () => {
    if (!pendingDelete) return
    deleteMessage.mutate(pendingDelete, {
      onSuccess: () => setPendingDelete(null),
    })
  }

  return (
    <div className="flex-1 flex min-w-0 min-h-0">
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <ChatHeader
          room={room}
          currentUserId={currentUserId}
          memberCount={room?.memberCount ?? room?.members.length ?? 0}
          isMembersOpen={membersOpen}
          onToggleMembers={() => setMembersOpen((open) => !open)}
        />

        <div className="flex-1 min-h-0 overflow-hidden">
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            hasMore={hasMore}
            isLoadingMore={loadingMore || isFetching}
            onLoadMore={handleLoadMore}
            onReply={setReplyTo}
            onEdit={handleEdit}
            onDelete={setPendingDelete}
            onToggleReaction={(messageId, emoji) =>
              toggleReaction.mutate({ messageId, dto: { emoji } })}
          />
        </div>

        {replyTo && (
          <ReplyBanner message={replyTo} onCancel={() => setReplyTo(null)} />
        )}

        <MessageInput
          onSend={handleSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          disabled={sendMessage.isPending}
          placeholder={`Message ${room?.type === 'Direct' ? 'your teammate' : 'the room'}...`}
        />
      </div>

      {membersOpen && (
        <MemberPanel
          roomId={roomId}
          currentUserId={currentUserId}
          onClose={() => setMembersOpen(false)}
        />
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Delete message?"
        message="This message will be removed for everyone in the room."
        confirmLabel="Delete"
        danger
        loading={deleteMessage.isPending}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
