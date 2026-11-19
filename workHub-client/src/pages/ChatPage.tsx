import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { useChatRooms } from '@/hooks/useChat'
import { useChatStore } from '@/stores/chatStore'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { EmptyChatState } from '@/components/chat/EmptyChatState'

export default function ChatPage() {
  const { roomId } = useParams<{ roomId?: string }>()
  const navigate = useNavigate()
  const setActiveRoom = useChatStore((s) => s.setActiveRoom)

  useChatRooms()

  useEffect(() => {
    setActiveRoom(roomId ?? null)
  }, [roomId, setActiveRoom])

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-surface-900">
      <ChatSidebar
        activeRoomId={roomId ?? null}
        onSelectRoom={(id) => navigate(`/chat/${id}`)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {roomId
          ? <ChatPanel key={roomId} roomId={roomId} />
          : <EmptyChatState />}
      </div>
    </div>
  )
}
