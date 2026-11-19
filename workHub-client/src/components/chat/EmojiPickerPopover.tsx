import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { X } from 'lucide-react'

interface EmojiPickerPopoverProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export function EmojiPickerPopover({ onSelect, onClose }: EmojiPickerPopoverProps) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute bottom-12 left-0 z-40 rounded-xl overflow-hidden
                      shadow-2xl border border-surface-700">
        <div className="flex justify-end bg-surface-900 px-2 py-1">
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-surface-400 hover:text-surface-100 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <Picker
          data={data}
          theme="dark"
          previewPosition="none"
          onEmojiSelect={(emoji: { native: string }) => onSelect(emoji.native)}
        />
      </div>
    </>
  )
}
