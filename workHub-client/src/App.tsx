import { useEffect, useState } from 'react'
import api from './lib/api'

interface HealthStatus {
  status: 'loading' | 'connected' | 'error'
  message: string
}

export default function App() {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'loading',
    message: 'Connecting to WorkSphere API...',
  })

  useEffect(() => {
    // ✅ Test connection to backend via Vite proxy
    fetch('/health')
      .then((res) => res.text())
      .then((text) => {
        setHealth({
          status: text.includes('Healthy') ? 'connected' : 'error',
          message: text.includes('Healthy')
            ? '✅ Connected to WorkSphere API'
            : '❌ API returned unexpected response',
        })
      })
      .catch(() => {
        setHealth({
          status: 'error',
          message: '❌ Cannot reach WorkSphere API — is the backend running?',
        })
      })
  }, [])

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="card max-w-md w-full mx-4 text-center space-y-6">

        {/* Logo */}
        <div className="space-y-2">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center
                          justify-center mx-auto">
            <span className="text-white font-bold text-2xl">W</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-50">WorkSphere</h1>
          <p className="text-surface-400 text-sm">
            Enterprise project management platform
          </p>
        </div>

        {/* API Status */}
        <div className={`rounded-lg p-4 text-sm font-medium border ${
          health.status === 'loading'
            ? 'bg-surface-700 border-surface-600 text-surface-300'
            : health.status === 'connected'
            ? 'bg-green-900/30 border-green-800 text-green-400'
            : 'bg-red-900/30 border-red-800 text-red-400'
        }`}>
          {health.status === 'loading' && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-surface-400
                              border-t-transparent rounded-full animate-spin" />
              {health.message}
            </div>
          )}
          {health.status !== 'loading' && health.message}
        </div>

        {/* Phase indicators */}
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-400">✅</span>
            <span className="text-surface-300">Phase 1 — Backend Auth + Roles</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-400">✅</span>
            <span className="text-surface-300">Phase 2 — Projects, Tasks, Comments</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-primary-400">🚀</span>
            <span className="text-surface-300">Phase 3 — React Frontend (Day 33)</span>
          </div>
        </div>

        <p className="text-surface-500 text-xs">
          Stack: React 18 · Vite · TypeScript · Tailwind CSS
        </p>
      </div>
    </div>
  )
}