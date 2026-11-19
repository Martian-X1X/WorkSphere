import { useEffect, useRef } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'

import { createChatHubConnection, disconnectChatHub } from '@/lib/chatHub'
import { getStoredAccessToken } from '@/lib/signalr'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import type { ChatRoom, Message, ReactionGroupDto } from '@/types/chat'

interface ReactionUpdatedPayload {
  messageId: string
  emoji: string
  group: ReactionGroupDto | null
  userIds?: string[]
}

export function ChatHubProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userId = useAuthStore((s) => s.user?.id ?? null)

  const queryClient = useQueryClient()
  const activeUserRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      void disconnectChatHub()
      activeUserRef.current = null
      useChatStore.getState().setConnected(false)
      return
    }

    // StrictMode remount / token refresh must not create a second connection.
    if (activeUserRef.current === userId) return
    activeUserRef.current = userId

    const hub = createChatHubConnection(getStoredAccessToken)

    const joinActiveRoom = async () => {
      const roomId = useChatStore.getState().activeRoomId
      if (!roomId || hub.state !== HubConnectionState.Connected) return
      try {
        await hub.invoke('JoinRoom', roomId)
      } catch (err) {
        console.error('[ChatHub] JoinRoom failed:', err)
      }
    }

    const patchRoomInCache = (
      roomId: string,
      patch: Partial<ChatRoom>,
      incrementUnread = false,
    ) => {
      queryClient.setQueryData<ChatRoom[]>(queryKeys.chat.rooms(), (rooms) =>
        rooms?.map((r) => r.id === roomId
          ? {
              ...r,
              ...patch,
              unreadCount: incrementUnread
                ? r.unreadCount + 1
                : r.unreadCount,
            }
          : r))
    }

    // ── Server → client events ────────────────────────────────────────

    hub.on('NewMessage', (message: Message) => {
      const store = useChatStore.getState()
      store.addMessage(message.chatRoomId, message)

      const isActive = message.chatRoomId === store.activeRoomId
      if (!isActive) store.incrementUnread(message.chatRoomId)

      patchRoomInCache(message.chatRoomId, {
        lastMessageAt: message.createdAt,
        lastMessagePreview: message.content.length > 100
          ? `${message.content.slice(0, 100)}…`
          : message.content,
      }, !isActive)
    })

    hub.on('MessageEdited', (message: Message) => {
      useChatStore.getState().updateMessage(message.chatRoomId, message)
    })

    hub.on('MessageDeleted', (payload: {
      messageId: string
      chatRoomId: string
    }) => {
      useChatStore.getState().deleteMessage(
        payload.chatRoomId,
        payload.messageId,
      )
    })

    hub.on('ReactionUpdated', (payload: ReactionUpdatedPayload) => {
      const { messages } = useChatStore.getState()
      const roomId = Object.keys(messages).find((rid) =>
        messages[rid].some((m) => m.id === payload.messageId),
      )
      if (!roomId) return

      // "IncludesMe" is per-viewer — recompute it from the user ids the
      // server broadcasts instead of trusting the acting user's value.
      const group = payload.group
        ? {
            ...payload.group,
            includesMe: payload.userIds
              ? payload.userIds.includes(userId)
              : payload.group.includesMe,
          }
        : null

      useChatStore.getState().updateReaction(
        roomId,
        payload.messageId,
        payload.emoji,
        group,
      )
    })

    hub.on('RoomUpdated', (payload: {
      roomId: string
      lastMessageAt: string
      lastMessagePreview: string
    }) => {
      useChatStore.getState().updateRoom(payload.roomId, {
        lastMessageAt: payload.lastMessageAt,
        lastMessagePreview: payload.lastMessagePreview,
      })
      patchRoomInCache(payload.roomId, {
        lastMessageAt: payload.lastMessageAt,
        lastMessagePreview: payload.lastMessagePreview,
      })
    })

    const adjustMemberCount = (roomId: string, delta: number) => {
      const room = useChatStore.getState().rooms.find((r) => r.id === roomId)
      const current = room?.memberCount ?? room?.members.length ?? 0
      const memberCount = Math.max(0, current + delta)
      useChatStore.getState().updateRoom(roomId, { memberCount })
      patchRoomInCache(roomId, { memberCount })
    }

    hub.on('MemberJoined', (payload: { roomId: string }) => {
      adjustMemberCount(payload.roomId, 1)
    })

    hub.on('MemberLeft', (payload: { roomId: string; userId: string }) => {
      adjustMemberCount(payload.roomId, -1)
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.members(payload.roomId),
      })
    })

    hub.on('MarkRead', (roomId: string) => {
      useChatStore.getState().clearUnread(roomId)
    })

    hub.on('UserTyping', () => {
      // Full typing indicator is wired up on Day 75.
    })

    hub.on('UserStoppedTyping', () => {
      // Full typing indicator is wired up on Day 75.
    })

    // ── Connection lifecycle ──────────────────────────────────────────

    hub.onreconnecting(() => {
      useChatStore.getState().setConnected(false)
    })

    hub.onreconnected(() => {
      useChatStore.getState().setConnected(true)
      void joinActiveRoom()
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.rooms() })
    })

    hub.onclose(() => {
      useChatStore.getState().setConnected(false)
      activeUserRef.current = null
    })

    const start = async () => {
      try {
        if (hub.state === HubConnectionState.Disconnected) {
          await hub.start()
        }

        const stillAuthenticated =
          useAuthStore.getState().isAuthenticated &&
          useAuthStore.getState().user?.id === userId

        if (!stillAuthenticated) {
          await disconnectChatHub()
          activeUserRef.current = null
          return
        }

        useChatStore.getState().setConnected(true)
        console.info('[ChatHub] Connected')

        await joinActiveRoom()
      } catch (err) {
        console.error('[ChatHub] Failed to connect:', err)
        useChatStore.getState().setConnected(false)
        activeUserRef.current = null
      }
    }

    void start()
  }, [isAuthenticated, userId, queryClient])

  return <>{children}</>
}
