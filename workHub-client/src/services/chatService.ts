import api from '@/lib/api'
import type {
  ChatRoom, Message, MessagePageDto,
  SendMessageDto, EditMessageDto, ToggleReactionDto,
  ReactionGroupDto, ChatRoomMember, CreateRoomDto,
} from '@/types/chat'

export const chatService = {
  // Rooms
  getRooms: (): Promise<ChatRoom[]> =>
    api.get('/chat/rooms').then((r) => r.data.data),

  getRoom: (roomId: string): Promise<ChatRoom> =>
    api.get(`/chat/rooms/${roomId}`).then((r) => r.data.data),

  createRoom: (dto: CreateRoomDto): Promise<ChatRoom> =>
    api.post('/chat/rooms', dto).then((r) => r.data.data),

  openDm: (targetUserId: string): Promise<ChatRoom> =>
    api.post(`/chat/dm/${targetUserId}`).then((r) => r.data.data),

  // Messages
  getMessages: (
    roomId: string,
    cursor?: string,
    pageSize = 30,
  ): Promise<MessagePageDto> =>
    api
      .get(`/chat/rooms/${roomId}/messages`, {
        params: { cursor, pageSize },
      })
      .then((r) => r.data.data),

  sendMessage: (roomId: string, dto: SendMessageDto): Promise<Message> =>
    api.post(`/chat/rooms/${roomId}/messages`, dto).then((r) => r.data.data),

  editMessage: (
    roomId: string,
    messageId: string,
    dto: EditMessageDto,
  ): Promise<Message> =>
    api
      .patch(`/chat/rooms/${roomId}/messages/${messageId}`, dto)
      .then((r) => r.data.data),

  deleteMessage: (roomId: string, messageId: string): Promise<void> =>
    api.delete(`/chat/rooms/${roomId}/messages/${messageId}`).then(() => undefined),

  // Reactions
  toggleReaction: (
    roomId: string,
    messageId: string,
    dto: ToggleReactionDto,
  ): Promise<ReactionGroupDto | null> =>
    api
      .post(`/chat/rooms/${roomId}/messages/${messageId}/reactions`, dto)
      .then((r) => r.data.data),

  // Members
  getMembers: (roomId: string): Promise<ChatRoomMember[]> =>
    api.get(`/chat/rooms/${roomId}/members`).then((r) => r.data.data),

  addMembers: (roomId: string, userIds: string[]): Promise<void> =>
    api.post(`/chat/rooms/${roomId}/members`, { userIds }).then(() => undefined),

  removeMember: (roomId: string, userId: string): Promise<void> =>
    api.delete(`/chat/rooms/${roomId}/members/${userId}`).then(() => undefined),

  // Read state
  markRead: (roomId: string): Promise<void> =>
    api.patch(`/chat/rooms/${roomId}/read`).then(() => undefined),
}
