import { Shield, Mail, Building2, Calendar } from 'lucide-react'
import { Avatar }    from '@/components/ui/Avatar'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { formatDate, formatRelative } from '@/utils'
import type { UserProfile } from '@/types'

interface ProfileHeaderProps {
  profile: UserProfile
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Large avatar */}
        <div className="relative flex-shrink-0">
          <Avatar
            name={profile.fullName}
            size="lg"
            className="w-20 h-20 text-xl"
          />
          {/* Online indicator */}
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400
                           rounded-full border-2 border-surface-800" />
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h1 className="text-2xl font-bold text-surface-50">
              {profile.fullName}
            </h1>
            <RoleBadge
              role={profile.role as 'Owner' | 'Admin' | 'Member'}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4
                          text-sm text-surface-500">
            {/* Email */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{profile.email}</span>
              {profile.isEmailVerified && (
                <span title="Email verified">
                  <Shield className="w-3 h-3 text-green-400 flex-shrink-0" />
                </span>
              )}
            </div>

            {/* Org */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{profile.organizationName}</span>
            </div>

            {/* Member since */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Member since {formatDate(profile.createdAt)}</span>
            </div>
          </div>

          {/* Last login */}
          {profile.lastLoginAt && (
            <p className="text-xs text-surface-600">
              Last signed in {formatRelative(profile.lastLoginAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
