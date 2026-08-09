import { Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Spinner }          from '@/components/ui/Spinner'
import { QueryError }       from '@/components/ui/QueryError'
import { ActivityFeed }     from '@/components/task/ActivityFeed'
import { ProfileHeader }    from '@/components/profile/ProfileHeader'
import { ProfileStats }     from '@/components/profile/ProfileStats'
import { EditProfileForm }  from '@/components/profile/EditProfileForm'
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm'
import { useProfile }       from '@/hooks/useProfile'
import { useOrgActivity }   from '@/hooks/useActivity'

export default function ProfilePage() {
  const { data: profile, isLoading, error, refetch } = useProfile()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" label="Loading profile..." />
      </div>
    )
  }

  if (error) {
    return (
      <QueryError
        error={error}
        onRetry={refetch}
        title="Failed to load profile"
      />
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">

      {/* ── Back nav ─────────────────────────────────────── */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm
                   text-surface-500 hover:text-surface-300
                   transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </Link>

      {/* ── Page title ───────────────────────────────────── */}
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">
          Manage your personal information and security
        </p>
      </div>

      {/* ── Profile header (full width) ──────────────────── */}
      <ProfileHeader profile={profile} />

      {/* ── Two-column layout ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Edit form + Password ───────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <EditProfileForm profile={profile} />
          <ChangePasswordForm />

          {/* ── Danger zone ──────────────────────────────── */}
          <div className="card border-red-900/30 bg-red-900/5 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider">
                Danger Zone
              </h2>
            </div>
            <p className="text-sm text-surface-500">
              Account deletion and data export will be available in a
              future update.
            </p>
            <button
              disabled
              className="px-4 py-2 rounded-xl border border-red-800/50
                         text-sm text-red-500 opacity-40
                         cursor-not-allowed"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* ── RIGHT: Stats + Recent activity ─────────────── */}
        <div className="lg:col-span-1 space-y-5">
          <ProfileStats profile={profile} />

          {/* Recent activity by this user */}
          <RecentUserActivity userId={profile.id} />
        </div>
      </div>
    </div>
  )
}

// ── Recent activity for this user ──────────────────────────────────
function RecentUserActivity({ userId }: { userId: string }) {
  const { data: allActivities, isLoading } = useOrgActivity(1, 50)

  const userActivities = (allActivities ?? [])
    .filter((a) => a.userId === userId)
    .slice(0, 8)

  return (
    <div className="card space-y-3">
      <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">
        Recent Activity
      </h2>
      <ActivityFeed
        activities={userActivities}
        isLoading={isLoading}
      />
    </div>
  )
}
