import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LogOut, User, Shield, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/features/auth/auth.service'
import { getRoleColor } from '@/shared/utils'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout, setPermissions } = useAuthStore()

  // ── Load full auth context (permissions) on mount ──────────────
  const { data: contextData } = useQuery({
    queryKey: ['auth-context'],
    queryFn: () => authService.getContext(),
    enabled: !!user,
  })

  useEffect(() => {
    if (contextData?.data.data.permissions) {
      setPermissions(contextData.data.data.permissions)
    }
  }, [contextData, setPermissions])

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        await authService.revoke(refreshToken)
      } catch { /* ignore */ }
    }
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const ctx = contextData?.data.data

  return (
    <div className="min-h-screen bg-surface-900">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="border-b border-surface-800 bg-surface-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <span className="font-semibold text-surface-50">WorkSphere</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-surface-400">{user.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">

          {/* Welcome */}
          <div>
            <h1 className="text-2xl font-bold text-surface-50">
              Welcome back, {user.firstName}! 👋
            </h1>
            <p className="text-surface-400 mt-1">
              You're logged in to <strong className="text-surface-200">
              {user.organizationName}</strong>
            </p>
          </div>

          {/* User info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Identity card */}
            <div className="card space-y-4">
              <div className="flex items-center gap-2 text-surface-400">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Your Identity</span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-surface-500">Full name</p>
                  <p className="text-surface-100 font-medium">{user.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500">Email</p>
                  <p className="text-surface-100 text-sm">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500">Role</p>
                  <p className={`font-semibold ${getRoleColor(user.role)}`}>
                    {user.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Organization card */}
            <div className="card space-y-4">
              <div className="flex items-center gap-2 text-surface-400">
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium">Organization</span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-surface-500">Name</p>
                  <p className="text-surface-100 font-medium">
                    {ctx?.organizationName ?? user.organizationName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-500">Plan</p>
                  <p className="text-surface-100 text-sm">
                    {ctx?.orgPlan ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-500">Status</p>
                  <span className={ctx?.orgIsActive
                    ? 'badge-active' : 'badge-archived'}>
                    {ctx?.orgIsActive ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>
            </div>

            {/* Permissions card */}
            <div className="card space-y-4">
              <div className="flex items-center gap-2 text-surface-400">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Permissions</span>
              </div>
              {ctx ? (
                <div className="space-y-2">
                  <p className="text-surface-100 font-medium">
                    {ctx.permissions.length} permissions
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {ctx.permissions.slice(0, 8).map((p: string) => (
                      <span
                        key={p}
                        className="badge bg-surface-700 text-surface-300 text-[10px]"
                      >
                        {p}
                      </span>
                    ))}
                    {ctx.permissions.length > 8 && (
                      <span className="badge bg-surface-700 text-surface-400 text-[10px]">
                        +{ctx.permissions.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <Spinner size="sm" />
              )}
            </div>
          </div>

          {/* Phase 3 progress */}
          <div className="card">
            <h2 className="font-semibold text-surface-100 mb-4">
              🚀 Phase 3 Progress
            </h2>
            <div className="space-y-2">
              {[
                { label: 'Day 33 — React + Vite + Tailwind setup', done: true },
                { label: 'Day 34 — Login + Register pages', done: true },
                { label: 'Day 35 — Dashboard layout + sidebar', done: false },
                { label: 'Day 36 — Projects list page', done: false },
                { label: 'Day 37 — Project detail + kanban', done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <span className={item.done ? 'text-green-400' : 'text-surface-600'}>
                    {item.done ? '✅' : '⬜'}
                  </span>
                  <span className={item.done
                    ? 'text-surface-300' : 'text-surface-600'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}