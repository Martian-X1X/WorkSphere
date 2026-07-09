import { Loader2 } from 'lucide-react'

export default function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  )
}
