export type ChatRoomType = 'General' | 'Project' | 'Direct' | 'Custom'
export type MessageType = 'Text' | 'System' | 'File' | 'Image'

export interface ChatRoom {
  id: string
  organizationId: string
  name: string | null
  description: string | null
  type: ChatRoomType
  projectId: string | null
  projectName?: string | null
  memberCount?: number
  icon: string | null
  isActive: boolean
  lastMessageAt: string | null
  lastMessagePreview: string | null
  createdAt: string
  unreadCount: number
  members: ChatRoomMember[]
}

export interface ChatRoomMember {
  id?: string
  userId: string
  fullName: string
  avatarUrl?: string | null
  role: string
  isOnline?: boolean
  lastReadMessageId?: string | null
  lastReadAt?: string | null
  isMuted: boolean
  joinedAt: string
}

export interface Message {
  id: string
  chatRoomId: string
  senderUserId: string
  senderName: string
  senderAvatar: string | null
  content: string
  type: MessageType
  parentMessageId: string | null
  parentMessage?: Pick<Message, 'id' | 'content' | 'senderName'>
  isEdited: boolean
  editedAt: string | null
  isDeleted: boolean
  createdAt: string
  reactions: ReactionGroupDto[]
  attachments: MessageAttachment[]
  replyCount: number
}

/** One emoji group on a message (mirrors the backend ReactionGroupDto). */
export interface ReactionGroupDto {
  emoji: string
  count: number
  includesMe: boolean
  userNames: string[]
}

export interface MessagePageDto {
  messages: Message[]
  nextCursor: string | null
  hasMore: boolean
}

export interface EditMessageDto {
  content: string
}

export interface ToggleReactionDto {
  emoji: string
}

export interface MessageReaction {
  id: string
  messageId: string
  userId: string
  userName: string
  emoji: string
  createdAt: string
}

export interface MessageAttachment {
  id: string
  messageId?: string
  fileName: string
  fileUrl: string
  contentType: string
  fileSizeBytes: number
  uploadedAt?: string
}

export type MessageAttachmentDto = MessageAttachment

export interface SendMessageDto {
  content: string
  type?: MessageType
  parentMessageId?: string
}

export interface CreateRoomDto {
  name: string
  description?: string
  type: ChatRoomType
  projectId?: string
  memberIds: string[]
}
