import { useEffect, useRef } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import type { HubConnection } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'

import { createChatHubConnection, disconnectChatHub } from '@/lib/chatHub'
import { getStoredAccessToken } from '@/lib/signalr'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { usePresenceStore } from '@/stores/presenceStore'
import { useTypingStore } from '@/stores/typingStore'
import type { ChatRoom, Message, ReactionGroupDto } from '@/types/chat'

interface ReactionUpdatedPayload {
  messageId: string
  emoji: string
  group: ReactionGroupDto | null
  userIds?: string[]
}

interface MessageDeletedPayload {
  messageId: string
  chatRoomId: string
}

interface RoomUpdatedPayload {
  roomId: string
  lastMessageAt: string
  lastMessagePreview: string
}

interface MemberPayload {
  roomId: string
  userId?: string
}

interface TypingStartedPayload {
  roomId: string
  userId: string
  userName: string
}

interface TypingStoppedPayload {
  roomId: string
  userId: string
}

const TYPING_EXPIRY_MS = 3000

export function ChatHubProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userId = useAuthStore((s) => s.user?.id ?? null)

  const queryClient = useQueryClient()
  const activeUserRef = useRef<string | null>(null)
  const lifecycleHubRef = useRef<HubConnection | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      void disconnectChatHub()
      activeUserRef.current = null
      lifecycleHubRef.current = null
      useChatStore.getState().setConnected(false)
      usePresenceStore.getState().clear()
      useTypingStore.getState().clear()
      return
    }

    if (activeUserRef.current && activeUserRef.current !== userId) {
      void disconnectChatHub()
      lifecycleHubRef.current = null
      usePresenceStore.getState().clear()
      useTypingStore.getState().clear()
    }

    if (activeUserRef.current === userId) return
    activeUserRef.current = userId

    const hub = createChatHubConnection(getStoredAccessToken)

    // roomId:userId → auto-expiry timer for a remote typist
    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()

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
                ? (r.unreadCount ?? 0) + 1
                : r.unreadCount,
            }
          : r))
    }

    const adjustMemberCount = (roomId: string, delta: number) => {
      const room = useChatStore.getState().rooms.find((r) => r.id === roomId)
      const current = room?.memberCount ?? room?.members.length ?? 0
      const memberCount = Math.max(0, current + delta)
      useChatStore.getState().updateRoom(roomId, { memberCount })
      patchRoomInCache(roomId, { memberCount })
    }

    // ── Named handlers (required for hub.off cleanup) ─────────────────

    const onNewMessage = (message: Message) => {
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
    }

    const onMessageEdited = (message: Message) => {
      useChatStore.getState().updateMessage(message.chatRoomId, message)
    }

    const onMessageDeleted = (payload: MessageDeletedPayload) => {
      useChatStore.getState().deleteMessage(
        payload.chatRoomId,
        payload.messageId,
      )
    }

    const onReactionUpdated = (payload: ReactionUpdatedPayload) => {
      const { messages } = useChatStore.getState()
      const roomId = Object.keys(messages).find((rid) =>
        messages[rid].some((m) => m.id === payload.messageId),
      )
      if (!roomId) return

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
    }

    const onRoomUpdated = (payload: RoomUpdatedPayload) => {
      useChatStore.getState().updateRoom(payload.roomId, {
        lastMessageAt: payload.lastMessageAt,
        lastMessagePreview: payload.lastMessagePreview,
      })
      patchRoomInCache(payload.roomId, {
        lastMessageAt: payload.lastMessageAt,
        lastMessagePreview: payload.lastMessagePreview,
      })
    }

    const onMemberJoined = (payload: MemberPayload) => {
      adjustMemberCount(payload.roomId, 1)
    }

    const onMemberLeft = (payload: MemberPayload) => {
      adjustMemberCount(payload.roomId, -1)
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.members(payload.roomId),
      })
    }

    const onMarkRead = (roomId: string) => {
      useChatStore.getState().clearUnread(roomId)
    }

    const clearTypingTimer = (key: string) => {
      const timer = typingTimers.get(key)
      if (timer) clearTimeout(timer)
      typingTimers.delete(key)
    }

    const onUserTyping = ({ roomId, userId, userName }: TypingStartedPayload) => {
      useTypingStore.getState().addTyping(roomId, userId, userName)

      const key = `${roomId}:${userId}`
      clearTypingTimer(key)
      typingTimers.set(key, setTimeout(() => {
        useTypingStore.getState().removeTyping(roomId, userId)
        typingTimers.delete(key)
      }, TYPING_EXPIRY_MS))
    }

    const onUserStoppedTyping = ({ roomId, userId }: TypingStoppedPayload) => {
      useTypingStore.getState().removeTyping(roomId, userId)
      clearTypingTimer(`${roomId}:${userId}`)
    }

    const onOnlineUsers = (userIds: string[]) => {
      usePresenceStore.getState().setOnlineUsers(userIds)
    }

    const onUserOnline = (userId: string) => {
      usePresenceStore.getState().setUserOnline(userId)
    }

    const onUserOffline = (userId: string) => {
      usePresenceStore.getState().setUserOffline(userId)
    }

    const onReconnecting = () => {
      useChatStore.getState().setConnected(false)
    }

    const onReconnected = () => {
      useChatStore.getState().setConnected(true)
      void joinActiveRoom()
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.rooms() })
    }

    const onClose = () => {
      useChatStore.getState().setConnected(false)
      useTypingStore.getState().clear()
      activeUserRef.current = null
    }

    // ── Register ──────────────────────────────────────────────────────

    hub.on('NewMessage', onNewMessage)
    hub.on('MessageEdited', onMessageEdited)
    hub.on('MessageDeleted', onMessageDeleted)
    hub.on('ReactionUpdated', onReactionUpdated)
    hub.on('RoomUpdated', onRoomUpdated)
    hub.on('MemberJoined', onMemberJoined)
    hub.on('MemberLeft', onMemberLeft)
    hub.on('MarkRead', onMarkRead)
    hub.on('UserTyping', onUserTyping)
    hub.on('UserStoppedTyping', onUserStoppedTyping)
    hub.on('OnlineUsers', onOnlineUsers)
    hub.on('UserOnline', onUserOnline)
    hub.on('UserOffline', onUserOffline)

    // SignalR has no offclose/offreconnected — register once per connection.
    if (lifecycleHubRef.current !== hub) {
      lifecycleHubRef.current = hub
      hub.onreconnecting(onReconnecting)
      hub.onreconnected(onReconnected)
      hub.onclose(onClose)
    }

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
          lifecycleHubRef.current = null
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

    // ── Cleanup — prevents duplicate listeners on re-render / StrictMode ──

    return () => {
      hub.off('NewMessage', onNewMessage)
      hub.off('MessageEdited', onMessageEdited)
      hub.off('MessageDeleted', onMessageDeleted)
      hub.off('ReactionUpdated', onReactionUpdated)
      hub.off('RoomUpdated', onRoomUpdated)
      hub.off('MemberJoined', onMemberJoined)
      hub.off('MemberLeft', onMemberLeft)
      hub.off('MarkRead', onMarkRead)
      hub.off('UserTyping', onUserTyping)
      hub.off('UserStoppedTyping', onUserStoppedTyping)
      hub.off('OnlineUsers', onOnlineUsers)
      hub.off('UserOnline', onUserOnline)
      hub.off('UserOffline', onUserOffline)
      typingTimers.forEach((timer) => clearTimeout(timer))
      typingTimers.clear()
      activeUserRef.current = null
    }
  }, [isAuthenticated, userId, queryClient])

  return <>{children}</>
}
