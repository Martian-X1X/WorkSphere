import { X } from 'lucide-react'
import type { Message } from '@/types/chat'

interface ReplyBannerProps {
  message: Message | undefined
  onCancel: () => void
}

export function ReplyBanner({ message, onCancel }: ReplyBannerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-surface-800/60
                    border-t border-surface-700">
      <div className="flex-1 min-w-0 border-l-2 border-primary-500 pl-2">
        <p className="text-xs font-medium text-primary-400">
          Replying to {message?.senderName ?? 'message'}
        </p>
        <p className="text-xs text-surface-400 truncate">
          {message?.content ?? 'Original message unavailable'}
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 text-surface-400 hover:text-surface-100 rounded"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
