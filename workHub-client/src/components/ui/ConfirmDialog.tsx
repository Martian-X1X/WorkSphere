import { AlertTriangle, X } from 'lucide-react'
import { Button } from './Button'

interface ConfirmDialogProps {
  isOpen:        boolean
  title:         string
  message:       string
  confirmLabel?: string
  danger?:       boolean
  loading?:      boolean
  onConfirm:     () => void
  onCancel:      () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-surface-800 border border-surface-700/50
                      rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                           flex-shrink-0 ${
                             danger ? 'bg-red-500/20' : 'bg-yellow-500/20'
                           }`}>
            <AlertTriangle className={`w-5 h-5 ${
              danger ? 'text-red-400' : 'text-yellow-400'
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-surface-100">{title}</h3>
            <p className="text-sm text-surface-400 mt-1">{message}</p>
          </div>

          <button
            onClick={onCancel}
            className="text-surface-500 hover:text-surface-300 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant={danger ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
