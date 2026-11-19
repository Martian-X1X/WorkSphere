import { useMemo, useState } from 'react'
import { MessageSquarePlus, Plus, Search } from 'lucide-react'

import { cn } from '@/utils'
import {
  formatMessageTime, getRoomColor, getRoomIcon, getRoomName,
} from '@/lib/chatUtils'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import type { ChatRoom } from '@/types/chat'
import { CreateRoomModal } from './CreateRoomModal'

interface ChatSidebarProps {
  activeRoomId: string | null
  onSelectRoom: (roomId: string) => void
}

export function ChatSidebar({ activeRoomId, onSelectRoom }: ChatSidebarProps) {
  const rooms = useChatStore((s) => s.rooms)
  const isConnected = useChatStore((s) => s.isConnected)
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')
  const [search, setSearch] = useState('')
  const [modalMode, setModalMode] = useState<'room' | 'dm' | null>(null)
  const [modalKey, setModalKey] = useState(0)

  const openModal = (mode: 'room' | 'dm') => {
    setModalMode(mode)
    setModalKey((current) => current + 1)
  }

  const visibleRooms = useMemo(() => rooms
    .filter((room) => {
      const name = getRoomName(room, currentUserId).toLowerCase()
      return name.includes(search.toLowerCase())
    })
    .sort((a, b) =>
      new Date(b.lastMessageAt ?? b.createdAt).getTime()
      - new Date(a.lastMessageAt ?? a.createdAt).getTime()),
  [rooms, search, currentUserId])

  const directRooms = visibleRooms.filter((room) => room.type === 'Direct')
  const groupRooms = visibleRooms.filter((room) => room.type !== 'Direct')

  const renderRoom = (room: ChatRoom) => {
    const isActive = room.id === activeRoomId
    return (
      <button
        key={room.id}
        type="button"
        onClick={() => onSelectRoom(room.id)}
        className={cn(
          'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors',
          isActive
            ? 'bg-primary-600/20'
            : 'hover:bg-surface-800',
        )}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white
                     text-xs font-semibold flex-shrink-0"
          style={{ backgroundColor: getRoomColor(room.id) }}
        >
          {getRoomIcon(room, currentUserId)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              'text-sm truncate',
              isActive ? 'text-primary-200 font-medium' : 'text-surface-200',
            )}>
              {getRoomName(room, currentUserId)}
            </span>
            {room.lastMessageAt && (
              <span className="text-[10px] text-surface-500 flex-shrink-0">
                {formatMessageTime(room.lastMessageAt)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className="text-[11px] text-surface-500 truncate">
              {room.lastMessagePreview ?? 'No messages yet'}
            </span>
            {room.unreadCount > 0 && (
              <span className="flex-shrink-0 min-w-[18px] px-1 py-0.5 rounded-full
                               bg-primary-600 text-white text-[10px] font-medium
                               text-center leading-none">
                {room.unreadCount > 99 ? '99+' : room.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    )
  }

  return (
    <>
      <aside className="w-56 md:w-72 flex-shrink-0 flex flex-col min-h-0
                        border-r border-surface-800 bg-surface-950">
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-surface-100">Chats</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isConnected ? 'bg-green-500' : 'bg-amber-500',
                )} />
                <span className="text-[10px] text-surface-500">
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="New direct message"
                onClick={() => openModal('dm')}
                className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100
                           hover:bg-surface-800 transition-colors"
              >
                <MessageSquarePlus className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Create room"
                onClick={() => openModal('room')}
                className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100
                           hover:bg-surface-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-surface-800
                          border border-surface-700 px-2.5">
            <Search className="w-3.5 h-3.5 text-surface-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="flex-1 bg-transparent py-1.5 text-xs text-surface-100
                         outline-none placeholder:text-surface-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-3">
          {directRooms.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider
                            text-surface-600">
                Direct Messages
              </p>
              <div className="space-y-0.5">{directRooms.map(renderRoom)}</div>
            </div>
          )}

          {groupRooms.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider
                            text-surface-600">
                Rooms
              </p>
              <div className="space-y-0.5">{groupRooms.map(renderRoom)}</div>
            </div>
          )}

          {visibleRooms.length === 0 && (
            <p className="text-xs text-surface-500 text-center px-3 py-8">
              {search ? 'No chats match your search' : 'No conversations yet'}
            </p>
          )}
        </div>
      </aside>

      <CreateRoomModal
        key={modalKey}
        open={modalMode !== null}
        mode={modalMode ?? 'room'}
        onClose={() => setModalMode(null)}
        onCreated={(room) => onSelectRoom(room.id)}
      />
    </>
  )
}
