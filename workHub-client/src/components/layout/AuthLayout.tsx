import { type ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* ── Left panel — branding ─────────────────────────── */}
      <div className="hidden lg:flex w-1/2 bg-surface-950 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-surface-50 font-semibold text-lg">WorkSphere</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-surface-50 leading-tight">
              Built for teams that demand reliability
            </h2>
            <p className="text-surface-400 text-lg">
              Multi-tenant project management — secure, scalable, production-ready.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
              { icon: '🔐', text: 'JWT auth with refresh token rotation' },
              { icon: '🏢', text: 'Multi-tenant with full data isolation' },
              { icon: '👥', text: 'Role-based permissions — Owner, Admin, Member' },
              { icon: '📊', text: 'Full audit trail on every action' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-surface-300 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-surface-600 text-xs">
          © 2026 WorkSphere. Built by Abdullah Mohammed Abdul Matin.
        </p>
      </div>

      {/* ── Right panel — form ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-surface-50 font-semibold text-lg">WorkSphere</span>
          </div>

          {/* Form header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-surface-50">{title}</h1>
            <p className="text-surface-400 text-sm">{subtitle}</p>
          </div>

          {/* Form content */}
          {children}
        </div>
      </div>
    </div>
  )
}