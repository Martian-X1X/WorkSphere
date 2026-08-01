import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, SearchX } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface-950 flex items-center
                    justify-center p-4">
      <div className="flex flex-col items-center justify-center text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-surface-800 border
                        border-surface-700 flex items-center justify-center
                        mb-6">
          <SearchX className="w-10 h-10 text-surface-500" />
        </div>

        {/* Error code */}
        <p className="text-6xl font-black text-surface-800 mb-2
                      tracking-tight select-none">
          404
        </p>

        {/* Title */}
        <h1 className="text-2xl font-bold text-surface-100 mb-3">
          Page Not Found
        </h1>

        {/* Message */}
        <p className="text-surface-400 max-w-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

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
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                       bg-primary-600 hover:bg-primary-500 text-white
                       text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
