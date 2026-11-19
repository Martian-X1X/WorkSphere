import { cn } from '@/utils'
import type { ReactionGroupDto } from '@/types/chat'

interface ReactionBarProps {
  reactions: ReactionGroupDto[]
  onToggle: (emoji: string) => void
  compact?: boolean
}

export function ReactionBar({ reactions, onToggle, compact }: ReactionBarProps) {
  if (reactions.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1 mt-1.5', compact && 'mt-1')}>
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          title={reaction.userNames.join(', ')}
          onClick={() => onToggle(reaction.emoji)}
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-xs transition-colors',
            reaction.includesMe
              ? 'bg-primary-600/20 border-primary-500/50 text-primary-300'
              : 'bg-surface-700/60 border-surface-600 text-surface-300 hover:border-surface-500',
          )}
        >
          <span>{reaction.emoji}</span>
          <span className="font-medium tabular-nums">{reaction.count}</span>
        </button>
      ))}
    </div>
  )
}
