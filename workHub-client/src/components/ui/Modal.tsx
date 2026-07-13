import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal box */}
      <div className={cn(
        'relative w-full bg-surface-900 border border-surface-700',
        'rounded-2xl shadow-2xl shadow-black/50 animate-fade-in',
        sizes[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-surface-800">
          <h2 className="text-base font-semibold text-surface-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-surface-500 hover:text-surface-300
                       hover:bg-surface-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}