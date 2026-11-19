import { useCallback, useEffect } from 'react'
import {
  useMutation, useQuery, useQueryClient,
} from '@tanstack/react-query'
import { HubConnectionState } from '@microsoft/signalr'
import toast from 'react-hot-toast'

import { getChatHubConnection } from '@/lib/chatHub'
import { queryKeys } from '@/lib/queryKeys'
import { chatService } from '@/services/chatService'
import { useChatStore } from '@/stores/chatStore'
import type {
  ChatRoom, CreateRoomDto, SendMessageDto, EditMessageDto, ToggleReactionDto,
} from '@/types/chat'

// ── List rooms ────────────────────────────────────────────────────

export function useChatRooms() {
  const setRooms = useChatStore((s) => s.setRooms)

  const query = useQuery({
    queryKey: queryKeys.chat.rooms(),
    queryFn: chatService.getRooms,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (query.data) setRooms(query.data)
  }, [query.data, setRooms])

  return query
}

export function useCreateRoom() {
  const queryClient = useQueryClient()
  const setActiveRoom = useChatStore((s) => s.setActiveRoom)

  return useMutation({
    mutationFn: (dto: CreateRoomDto) => chatService.createRoom(dto),
    onSuccess: (room: ChatRoom) => {
      setActiveRoom(room.id)
      void queryClient.invalidateQueries({ queryKey: queryKeys.chat.rooms() })
      toast.success('Room created')
    },
    onError: () => toast.error('Failed to create room'),
  })
}

// ── Active room ───────────────────────────────────────────────────

export function useActiveRoom(roomId: string | null) {
  useEffect(() => {
    if (!roomId) return

    const hub = getChatHubConnection()
    if (hub?.state === HubConnectionState.Connected) {
      void hub.invoke('JoinRoom', roomId).catch(console.error)
    }

    return () => {
      const current = getChatHubConnection()
      if (current?.state === HubConnectionState.Connected) {
        void current.invoke('LeaveRoom', roomId).catch(console.error)
      }
    }
  }, [roomId])
}

export function useChatMembers(roomId: string) {
  return useQuery({
    queryKey: queryKeys.chat.members(roomId),
    queryFn: () => chatService.getMembers(roomId),
    staleTime: 30_000,
    enabled: !!roomId,
  })
}

// ── Messages ──────────────────────────────────────────────────────

export function useMessages(roomId: string) {
  const setMessages = useChatStore((s) => s.setMessages)
  const messages = useChatStore((s) => s.messages[roomId] ?? [])

  const query = useQuery({
    queryKey: queryKeys.chat.messages(roomId),
    queryFn: () => chatService.getMessages(roomId),
    staleTime: 10_000,
    enabled: !!roomId,
  })

  useEffect(() => {
    if (query.data?.messages) {
      setMessages(roomId, query.data.messages)
    }
  }, [query.data, roomId, setMessages])

  return {
    ...query,
    messages,
    hasMore: query.data?.hasMore ?? false,
    cursor: query.data?.nextCursor ?? null,
  }
}

// ── Load older messages on scroll up ─────────────────────────────

export function useLoadMoreMessages(roomId: string) {
  const prependMessages = useChatStore((s) => s.prependMessages)

  return useCallback(
    async (cursor: string) => {
      const page = await chatService.getMessages(roomId, cursor)
      prependMessages(roomId, page.messages)
      return page
    },
    [roomId, prependMessages],
  )
}

// ── Send message ──────────────────────────────────────────────────

export function useSendMessage(roomId: string) {
  return useMutation({
    mutationFn: (dto: SendMessageDto) => chatService.sendMessage(roomId, dto),
    onError: () => toast.error('Failed to send message'),
    // SignalR "NewMessage" adds the message — no local insert, no invalidation.
  })
}

// ── Edit message ──────────────────────────────────────────────────

export function useEditMessage(roomId: string) {
  return useMutation({
    mutationFn: ({ messageId, dto }: {
      messageId: string
      dto: EditMessageDto
    }) => chatService.editMessage(roomId, messageId, dto),
    onError: () => toast.error('Failed to edit message'),
  })
}

// ── Delete message ────────────────────────────────────────────────

export function useDeleteMessage(roomId: string) {
  return useMutation({
    mutationFn: (messageId: string) =>
      chatService.deleteMessage(roomId, messageId),
    onError: () => toast.error('Failed to delete message'),
  })
}

// ── Toggle reaction ───────────────────────────────────────────────

export function useToggleReaction(roomId: string) {
  return useMutation({
    mutationFn: ({ messageId, dto }: {
      messageId: string
      dto: ToggleReactionDto
    }) => chatService.toggleReaction(roomId, messageId, dto),
    onError: () => toast.error('Failed to add reaction'),
  })
}

// ── Mark room as read ─────────────────────────────────────────────

export function useMarkRoomRead(roomId: string) {
  const clearUnread = useChatStore((s) => s.clearUnread)

  return useCallback(async () => {
    clearUnread(roomId)
    await chatService.markRead(roomId)

    // Echo to the user's other tabs through the hub.
    const hub = getChatHubConnection()
    if (hub?.state === HubConnectionState.Connected) {
      void hub.invoke('MarkRead', roomId).catch(console.error)
    }
  }, [roomId, clearUnread])
}

// ── Open or get DM ────────────────────────────────────────────────

export function useOpenDm() {
  const queryClient = useQueryClient()
  const setActiveRoom = useChatStore((s) => s.setActiveRoom)

  return useMutation({
    mutationFn: (targetUserId: string) => chatService.openDm(targetUserId),
    onSuccess: (room) => {
      setActiveRoom(room.id)
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.rooms() })
    },
    onError: () => toast.error('Failed to open conversation'),
  })
}

export function useRemoveMember(roomId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => chatService.removeMember(roomId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.members(roomId),
      })
      toast.success('Member removed')
    },
    onError: () => toast.error('Failed to remove member'),
  })
}

export function useAddMembers(roomId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userIds: string[]) => chatService.addMembers(roomId, userIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.members(roomId),
      })
      toast.success('Members added')
    },
    onError: () => toast.error('Failed to add members'),
  })
}
