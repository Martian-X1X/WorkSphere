import {
  format, isToday, isYesterday, isSameDay,
} from 'date-fns'
import type { ChatRoom } from '@/types/chat'

export function formatMessageTime(iso: string): string {
  const date = new Date(iso)
  if (isToday(date)) return format(date, 'h:mm a')
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`
  return format(date, 'MMM d, h:mm a')
}

export function formatDateSeparator(iso: string): string {
  const date = new Date(iso)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMMM d')
}

export function getRoomName(room: ChatRoom, currentUserId: string): string {
  if (room.name) return room.name
  if (room.type === 'Direct') {
    const other = room.members?.find((m) => m.userId !== currentUserId)
    return other?.fullName ?? 'Direct Message'
  }
  if (room.type === 'General') return 'general'
  return 'Unnamed Room'
}

export function getRoomIcon(room: ChatRoom, currentUserId: string): string {
  if (room.icon) return room.icon
  return getRoomName(room, currentUserId).charAt(0).toUpperCase()
}

export function getRoomColor(roomId: string): string {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f97316',
    '#10b981', '#3b82f6', '#14b8a6', '#f59e0b',
  ]
  let hash = 0
  for (let i = 0; i < roomId.length; i++) hash += roomId.charCodeAt(i)
  return colors[hash % colors.length]
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function sameDay(a: string, b: string): boolean {
  return isSameDay(new Date(a), new Date(b))
}
