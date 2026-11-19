import { MessageCircle } from 'lucide-react'

export function EmptyChatState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-surface-800/70 flex items-center
                      justify-center mb-4">
        <MessageCircle className="w-8 h-8 text-primary-400" />
      </div>
      <h2 className="text-lg font-semibold text-surface-100 mb-1">
        Select a conversation
      </h2>
      <p className="text-sm text-surface-500 max-w-xs">
        Choose a room from the sidebar or create a new one to start chatting
        with your team.
      </p>
    </div>
  )
}
