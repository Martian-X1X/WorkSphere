import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FolderKanban,
  CheckSquare,
  Users,
  Activity,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/stores/authStore'
import { Permissions } from '@/lib/permissions'
import { authService } from '@/services/auth.service'
import { getRoleColor, cn } from '@/utils'

// ── Quick stat card ────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  iconColor: string
  to: string
  sublabel?: string
}

function StatCard({ label, value, icon: Icon, iconColor, to, sublabel }: StatCardProps) {
  return (
    <Link to={to} className="card-hover block group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-surface-400">{label}</p>
          <p className="text-2xl font-bold text-surface-50">{value}</p>
          {sublabel && (
            <p className="text-xs text-surface-500">{sublabel}</p>
          )}
        </div>
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          'bg-surface-700 group-hover:scale-110 transition-transform'
        )}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-4 text-xs text-surface-500
                      group-hover:text-primary-400 transition-colors">
        <span>View all</span>
        <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user, setPermissions, permissions } = useAuthStore()

  // ── Load auth context for permissions ─────────────────────────
  const { data: contextData } = useQuery({
    queryKey: ['auth-context'],
    queryFn: () => authService.getContext(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    if (contextData?.data.data.permissions) {
      setPermissions(contextData.data.data.permissions)
    }
  }, [contextData, setPermissions])

  const ctx = contextData?.data.data

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Welcome header ─────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-surface-50">
            Good {getGreeting()}, {user?.firstName}! 👋
          </h1>
          <p className="text-surface-400 mt-1 text-sm">
            Here's what's happening in{' '}
            <span className="text-surface-200 font-medium">
              {user?.organizationName}
            </span>
          </p>
        </div>

        {/* Quick role badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5
                        bg-surface-800 rounded-lg border border-surface-700">
          <span className="text-xs text-surface-500">Signed in as</span>
          <span className={cn('text-xs font-semibold', getRoleColor(user?.role ?? ''))}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Projects"
          value="4"
          icon={FolderKanban}
          iconColor="text-blue-400"
          to="/projects"
          sublabel="3 active"
        />
        <StatCard
          label="My Tasks"
          value="—"
          icon={CheckSquare}
          iconColor="text-green-400"
          to="/tasks"
          sublabel="View all"
        />
        {permissions.includes('members.view') && (
          <StatCard
            label="Members"
            value="4"
            icon={Users}
            iconColor="text-purple-400"
            to="/members"
            sublabel="In your org"
          />
        )}
        <StatCard
          label="Activity"
          value="Live"
          icon={Activity}
          iconColor="text-orange-400"
          to="/activity"
          sublabel="Audit trail"
        />
      </div>

      {/* ── Two-column content ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Auth context card */}
        <div className="lg:col-span-2 card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-surface-100">Your Account</h2>
            <TrendingUp className="w-4 h-4 text-surface-500" />
          </div>

          {ctx ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Email', value: ctx.email },
                { label: 'Role', value: ctx.role, color: getRoleColor(ctx.role) },
                { label: 'Organization', value: ctx.organizationName },
                { label: 'Plan', value: ctx.orgPlan },
                { label: 'Email Verified', value: ctx.isEmailVerified ? 'Yes' : 'No' },
                { label: 'Org Status', value: ctx.orgIsActive ? 'Active' : 'Suspended' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-surface-500">{item.label}</p>
                  <p className={cn(
                    'text-sm font-medium mt-0.5',
                    item.color ?? 'text-surface-200'
                  )}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-24">
              <Spinner />
            </div>
          )}
        </div>

        {/* Permissions card */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-surface-100">Permissions</h2>
            <span className="text-xs text-surface-500">
              {permissions.length} total
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {([
              { label: 'Organizations', perms: Object.values(Permissions.Org) },
              { label: 'Members',       perms: Object.values(Permissions.Members) },
              { label: 'Projects',      perms: Object.values(Permissions.Projects) },
              { label: 'Tasks',         perms: Object.values(Permissions.Tasks) },
              { label: 'Comments',      perms: Object.values(Permissions.Comments) },
              { label: 'Reports',       perms: Object.values(Permissions.Reports) },
            ] as const).map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-surface-500 uppercase
                              tracking-wider mb-1.5">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.perms.map((perm) => {
                    const granted = permissions.includes(perm)
                    return (
                      <span
                        key={perm}
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                          granted
                            ? 'bg-green-900/30 text-green-400 border-green-800/50'
                            : 'bg-surface-800 text-surface-600 border-surface-700/50'
                        )}
                      >
                        {perm.split('.').pop()}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick navigation ───────────────────────────── */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-surface-100">Quick Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Projects', icon: FolderKanban, to: '/projects', color: 'text-blue-400', bg: 'bg-blue-900/20' },
            { label: 'My Tasks', icon: CheckSquare, to: '/tasks', color: 'text-green-400', bg: 'bg-green-900/20' },
            { label: 'Members', icon: Users, to: '/members', color: 'text-purple-400', bg: 'bg-purple-900/20' },
            { label: 'Activity', icon: Activity, to: '/activity', color: 'text-orange-400', bg: 'bg-orange-900/20' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-2 p-4 rounded-xl
                         bg-surface-700/30 hover:bg-surface-700/60 border
                         border-surface-700 hover:border-surface-600
                         transition-all duration-150 group"
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                item.bg,
                'group-hover:scale-110 transition-transform'
              )}>
                <item.icon className={cn('w-5 h-5', item.color)} />
              </div>
              <span className="text-sm font-medium text-surface-300
                               group-hover:text-surface-100 transition-colors">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Greeting helper ────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}