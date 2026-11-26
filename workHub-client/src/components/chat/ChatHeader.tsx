import { Users } from 'lucide-react'

import { UserAvatar } from '@/components/ui/UserAvatar'
import { cn } from '@/utils'
import { getRoomColor, getRoomIcon, getRoomName } from '@/lib/chatUtils'
import { useChatStore } from '@/stores/chatStore'
import { usePresenceStore } from '@/stores/presenceStore'
import type { ChatRoom } from '@/types/chat'

interface ChatHeaderProps {
  room?: ChatRoom
  currentUserId: string
  memberCount: number
  isMembersOpen: boolean
  onToggleMembers: () => void
}

export function ChatHeader({
  room,
  currentUserId,
  memberCount,
  isMembersOpen,
  onToggleMembers,
}: ChatHeaderProps) {
  const isConnected = useChatStore((s) => s.isConnected)

  if (!room) {
    return <div className="h-16 border-b border-surface-800 bg-surface-900" />
  }

  const name = getRoomName(room, currentUserId)
  const otherMember = room.type === 'Direct'
    ? room.members.find((member) => member.userId !== currentUserId)
    : undefined

  return (
    <header className="h-16 flex-shrink-0 flex items-center gap-3 px-4
                       border-b border-surface-800 bg-surface-900">
      {room.type === 'Direct'
        ? (
          <UserAvatar
            userId={otherMember?.userId ?? ''}
            name={name}
            avatarUrl={otherMember?.avatarUrl}
            size="sm"
            showPresence
          />
        )
        : (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center
                       text-white font-semibold flex-shrink-0"
            style={{ backgroundColor: getRoomColor(room.id) }}
          >
            {getRoomIcon(room, currentUserId)}
          </div>
        )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-surface-100 truncate">{name}</h1>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-800
                           text-surface-400 uppercase tracking-wide">
            {room.type}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            isConnected ? 'bg-green-500' : 'bg-amber-500',
          )} />
          <span className="text-[11px] text-surface-500">
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
          {room.type === 'Direct' && otherMember && (
            <>
              <span className="text-[11px] text-surface-600">·</span>
              <OnlineStatusText userId={otherMember.userId} />
            </>
          )}
          {room.projectName && (
            <span className="text-[11px] text-surface-600 truncate">
              · {room.projectName}
            </span>
          )}
        </div>
      </div>

      {room.type !== 'Direct' && (
        <button
          type="button"
          onClick={onToggleMembers}
          title="Members"
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors',
            isMembersOpen
              ? 'bg-primary-600/20 text-primary-300'
              : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200',
          )}
        >
          <Users className="w-4 h-4" />
          <span className="tabular-nums">{memberCount}</span>
        </button>
      )}
    </header>
  )
}

function OnlineStatusText({ userId }: { userId: string }) {
  const isOnline = usePresenceStore((s) => s.onlineUserIds.has(userId))

  return (
    <span className={cn(
      'text-[11px] font-medium',
      isOnline ? 'text-green-500' : 'text-surface-500',
    )}>
      {isOnline ? 'Online' : 'Offline'}
    </span>
  )
}
