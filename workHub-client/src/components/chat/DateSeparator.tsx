import { formatDateSeparator } from '@/lib/chatUtils'

interface DateSeparatorProps {
  date: string
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <div className="flex-1 h-px bg-surface-800" />
      <span className="text-[11px] font-medium text-surface-500 bg-surface-900 px-2 rounded-full">
        {formatDateSeparator(date)}
      </span>
      <div className="flex-1 h-px bg-surface-800" />
    </div>
  )
}
