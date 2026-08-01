import { Link, useNavigate } from 'react-router-dom'
import { ShieldX, ArrowLeft, Home } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface ForbiddenPageProps {
  // Optional — for inline use (inside a page section, not full page)
  inline?:   boolean
  message?:  string
  returnTo?: string
}

export default function ForbiddenPage({
  inline    = false,
  message   = 'You do not have permission to access this page.',
  returnTo  = '/dashboard',
}: ForbiddenPageProps) {
  const navigate  = useNavigate()
  const { user }  = useAuthStore()

  const content = (
    <div className={`flex flex-col items-center justify-center text-center
                     ${inline ? 'py-16' : 'min-h-screen bg-surface-950'}`}>
      {/* Icon */}
      <div className="w-20 h-20 rounded-3xl bg-red-900/20 border
                      border-red-800/30 flex items-center justify-center
                      mb-6">
        <ShieldX className="w-10 h-10 text-red-400" />
      </div>

      {/* Error code */}
      <p className="text-6xl font-black text-surface-800 mb-2
                    tracking-tight select-none">
        403
      </p>

      {/* Title */}
      <h1 className="text-2xl font-bold text-surface-100 mb-3">
        Access Denied
      </h1>

      {/* Message */}
      <p className="text-surface-400 max-w-sm mb-2">
        {message}
      </p>

      {/* Role hint */}
      {user && (
        <p className="text-sm text-surface-600 mb-8">
          You are signed in as{' '}
          <span className="text-surface-400 font-medium">
            {user.fullName}
          </span>
          {' '}({user.role})
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl
                     border border-surface-700 bg-surface-800
                     text-sm text-surface-300 hover:text-surface-100
                     hover:border-surface-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back
        </button>

        <Link
          to={returnTo}
          className="flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-primary-600 hover:bg-primary-500 text-white
                     text-sm font-medium transition-colors"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
      </div>
    </div>
  )

  if (inline) return content

  return (
    <div className="min-h-screen bg-surface-950 flex items-center
                    justify-center p-4">
      {content}
    </div>
  )
}
