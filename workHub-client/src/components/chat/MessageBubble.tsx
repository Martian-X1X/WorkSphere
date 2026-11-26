import { useState } from 'react'
import { Check, CornerUpLeft, Pencil, Smile, Trash2, X } from 'lucide-react'

import { UserAvatar } from '@/components/ui/UserAvatar'
import { cn } from '@/utils'
import { formatFileSize, formatMessageTime } from '@/lib/chatUtils'
import type { Message } from '@/types/chat'
import { ReactionBar } from './ReactionBar'

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '👀', '🙏']

interface MessageBubbleProps {
  message: Message
  isMine: boolean
  showAvatar: boolean
  parentMessage?: Message
  onReply: (message: Message) => void
  onEdit: (messageId: string, content: string) => void
  onDelete: (messageId: string) => void
  onToggleReaction: (messageId: string, emoji: string) => void
}

export function MessageBubble({
  message,
  isMine,
  showAvatar,
  parentMessage,
  onReply,
  onEdit,
  onDelete,
  onToggleReaction,
}: MessageBubbleProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)
  const [showReactions, setShowReactions] = useState(false)

  const saveEdit = () => {
    const content = draft.trim()
    if (!content || content === message.content) {
      setEditing(false)
      setDraft(message.content)
      return
    }
    onEdit(message.id, content)
    setEditing(false)
  }

  return (
    <div className={cn(
      'group flex gap-2 px-4 py-1',
      isMine ? 'justify-end' : 'justify-start',
    )}>
      {!isMine && (
        showAvatar
          ? (
            <UserAvatar
              userId={message.senderUserId}
              name={message.senderName}
              avatarUrl={message.senderAvatar}
              size="sm"
              showPresence
            />
          )
          : <div className="w-7 flex-shrink-0" />
      )}

      <div className={cn('max-w-[75%] min-w-0', isMine && 'items-end flex flex-col')}>
        {!isMine && showAvatar && (
          <p className="text-xs text-surface-400 mb-0.5 ml-1">
            {message.senderName}
          </p>
        )}

        {parentMessage && (
          <div className={cn(
            'mb-1 px-2.5 py-1.5 rounded-lg border-l-2 border-primary-500 text-xs max-w-full',
            isMine ? 'bg-primary-700/40' : 'bg-surface-800',
          )}>
            <p className="font-medium text-primary-300 truncate">
              {parentMessage.senderName}
            </p>
            <p className="text-surface-400 truncate">{parentMessage.content}</p>
          </div>
        )}

        <div className={cn(
          'relative rounded-2xl px-3 py-2 text-sm break-words',
          isMine
            ? 'bg-primary-600 text-white rounded-br-sm'
            : 'bg-surface-800 text-surface-100 rounded-bl-sm',
          message.isDeleted && 'italic opacity-70',
          message.type === 'System' && 'bg-transparent text-surface-500 italic text-xs',
        )}>
          {editing ? (
            <div className="flex flex-col gap-2 min-w-[240px]">
              <textarea
                rows={2}
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditing(false)
                    setDraft(message.content)
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    saveEdit()
                  }
                }}
                className="w-full rounded-lg bg-surface-900/60 border border-surface-500
                           text-surface-100 text-sm p-2 outline-none resize-none"
              />
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => { setEditing(false); setDraft(message.content) }}
                  className="p-1 rounded hover:bg-surface-700 text-surface-300"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="p-1 rounded bg-primary-500 hover:bg-primary-400 text-white"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            message.content
          )}

          {message.attachments.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.fileUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'mt-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs',
                isMine ? 'bg-white/10 text-white' : 'bg-surface-700 text-surface-200',
              )}
            >
              <span className="truncate flex-1">{attachment.fileName}</span>
              <span className="opacity-70">{formatFileSize(attachment.fileSizeBytes)}</span>
            </a>
          ))}

          {showReactions && !message.isDeleted && (
            <div className="absolute -top-9 left-0 flex gap-0.5 rounded-full
                            bg-surface-900 border border-surface-700 px-1 py-1 shadow-lg z-10">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onToggleReaction(message.id, emoji)
                    setShowReactions(false)
                  }}
                  className="w-7 h-7 rounded-full hover:bg-surface-700 text-base"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={cn(
          'flex items-center gap-2 mt-0.5 px-1 text-[10px] text-surface-500',
          isMine && 'flex-row-reverse',
        )}>
          <span>{formatMessageTime(message.createdAt)}</span>
          {message.isEdited && <span>edited</span>}
          {!message.isDeleted && (
            <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100
                             focus-within:opacity-100 transition-opacity">
              <button
                type="button"
                title="React"
                onClick={() => setShowReactions((open) => !open)}
                className="p-0.5 hover:text-surface-200"
              >
                <Smile className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Reply"
                onClick={() => onReply(message)}
                className="p-0.5 hover:text-surface-200"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
              {isMine && (
                <>
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => { setDraft(message.content); setEditing(true) }}
                    className="p-0.5 hover:text-surface-200"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => onDelete(message.id)}
                    className="p-0.5 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </span>
          )}
        </div>

        <ReactionBar
          reactions={message.reactions}
          onToggle={(emoji) => onToggleReaction(message.id, emoji)}
          compact
        />
      </div>
    </div>
  )
}
