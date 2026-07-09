import { Link } from 'react-router-dom'
import { ROUTES } from '@/router/routes'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-surface-50">404</h1>
        <p className="text-surface-400 text-lg">Page not found</p>
        <Link
          to={ROUTES.DASHBOARD}
          className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
