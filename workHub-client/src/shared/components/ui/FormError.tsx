import { AlertCircle } from 'lucide-react'
import { cn } from '@/shared/utils'

interface FormErrorProps {
  message?: string
  className?: string
}

export default function FormError({ message, className }: FormErrorProps) {
  if (!message) return null

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5',
        className,
      )}
    >
      <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
      <p className="text-sm text-red-400">{message}</p>
    </div>
  )
}
