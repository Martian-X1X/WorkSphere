import toast from 'react-hot-toast'
import type { ClassifiedError } from './errors'

// ── Deduplication registry ─────────────────────────────────────────
// Prevents same toast appearing multiple times within 3 seconds
const shownToasts = new Map<string, number>()
const DEDUP_WINDOW = 3000 // ms

function shouldShow(key: string): boolean {
  const lastShown = shownToasts.get(key)
  const now = Date.now()
  if (lastShown && now - lastShown < DEDUP_WINDOW) return false
  shownToasts.set(key, now)
  return true
}

// ── Offline toast state ────────────────────────────────────────────
let offlineToastId: string | null = null

// ── Show error from classified error ──────────────────────────────
export function showErrorToast(classified: ClassifiedError): void {
  const { type, message, errors, correlationId } = classified

  // Silent — components handle these
  if (type === 'not_found' || type === 'auth') return

  // Deduplication key
  const key = `${type}:${message}`
  if (!shouldShow(key)) return

  switch (type) {
    case 'network':
      // Show persistent offline toast
      if (!offlineToastId) {
        offlineToastId = toast.error(
          '📡 No internet connection',
          {
            id:       'offline',
            duration: Infinity,
          }
        )
      }
      break

    case 'timeout':
      toast.error(`⏱ ${message}`, { duration: 5000 })
      break

    case 'forbidden':
      toast.error(`🔒 ${message}`, {
        id:       'forbidden',
        duration: 4000,
      })
      break

    case 'validation':
      // Show all validation errors if multiple
      if (errors.length > 1) {
        toast.error(
          `⚠ ${errors.length} validation errors:\n${errors.slice(0, 3).join('\n')}`,
          { duration: 6000 }
        )
      } else {
        toast.error(`⚠ ${message}`, { duration: 5000 })
      }
      break

    case 'conflict':
      toast.error(`⚡ ${message}`, { duration: 5000 })
      break

    case 'rate_limit':
      toast.error(`🚦 ${message}`, { duration: 5000 })
      break

    case 'server': {
      const msg = correlationId
        ? `${message}\nID: ${correlationId}`
        : message
      toast.error(`🔥 ${msg}`, { duration: 8000 })
      break
    }

    case 'unavailable':
      toast.error(`🚧 ${message}`, { duration: 6000 })
      break

    default:
      toast.error(message, { duration: 5000 })
  }
}

// ── Dismiss offline toast when back online ─────────────────────────
export function dismissOfflineToast(): void {
  if (offlineToastId) {
    toast.dismiss('offline')
    offlineToastId = null
    toast.success('✅ Back online!', { duration: 3000 })
  }
}
