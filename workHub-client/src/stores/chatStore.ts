import { create } from 'zustand'
import type { ChatRoom, Message, ReactionGroupDto } from '@/types/chat'

interface ChatState {
  rooms:           ChatRoom[]
  activeRoomId:    string | null
  messages:        Record<string, Message[]>   // roomId → messages
  isConnected:     boolean
  isSidebarOpen:   boolean

  // Actions
  setRooms:         (rooms: ChatRoom[]) => void
  updateRoom:       (roomId: string, patch: Partial<ChatRoom>) => void
  setActiveRoom:    (roomId: string | null) => void
  setSidebarOpen:   (val: boolean) => void
  setConnected:     (val: boolean) => void

  // Message actions
  setMessages:      (roomId: string, msgs: Message[]) => void
  prependMessages:  (roomId: string, msgs: Message[]) => void
  addMessage:       (roomId: string, msg: Message) => void
  updateMessage:    (roomId: string, msg: Message) => void
  deleteMessage:    (roomId: string, messageId: string) => void
  updateReaction:   (roomId: string, messageId: string, emoji: string, group: ReactionGroupDto | null) => void

  // Unread
  incrementUnread:  (roomId: string) => void
  clearUnread:      (roomId: string) => void
  getTotalUnread:   () => number
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms:          [],
  activeRoomId:   null,
  messages:       {},
  isConnected:    false,
  isSidebarOpen:  false,

  setRooms:      (rooms)  => set({ rooms }),
  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),
  setSidebarOpen:(val)    => set({ isSidebarOpen: val }),
  setConnected:  (val)    => set({ isConnected: val }),

  updateRoom: (roomId, patch) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === roomId ? { ...r, ...patch } : r
      ),
    })),

  setMessages: (roomId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [roomId]: msgs } })),

  prependMessages: (roomId, msgs) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: [...msgs, ...(s.messages[roomId] ?? [])],
      },
    })),

  addMessage: (roomId, msg) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: [...(s.messages[roomId] ?? []), msg],
      },
    })),

  updateMessage: (roomId, msg) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] ?? []).map((m) =>
          m.id === msg.id ? msg : m
        ),
      },
    })),

  deleteMessage: (roomId, messageId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] ?? []).map((m) =>
          m.id === messageId
            ? { ...m, isDeleted: true, content: '[message deleted]' }
            : m
        ),
      },
    })),

  updateReaction: (roomId, messageId, emoji, group) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] ?? []).map((m) => {
          if (m.id !== messageId) return m
          const otherReactions = m.reactions.filter((r) => r.emoji !== emoji)
          return {
            ...m,
            reactions: group ? [...otherReactions, group] : otherReactions,
          }
        }),
      },
    })),

  incrementUnread: (roomId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === roomId
          ? { ...r, unreadCount: (r.unreadCount ?? 0) + 1 }
          : r
      ),
    })),

  clearUnread: (roomId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === roomId ? { ...r, unreadCount: 0 } : r
      ),
    })),

  getTotalUnread: () =>
    get().rooms.reduce((sum, r) => sum + (r.unreadCount ?? 0), 0),
}))
