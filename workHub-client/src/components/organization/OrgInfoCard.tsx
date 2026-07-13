import { Building2, Users, Crown, Calendar } from 'lucide-react'
import type { Organization } from '@/types'
import { formatDate } from '@/utils'

interface OrgInfoCardProps {
  org: Organization
}

export function OrgInfoCard({ org }: OrgInfoCardProps) {
  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        {/* Org avatar */}
        <div className="w-14 h-14 rounded-xl bg-primary-700/30 border
                        border-primary-700/50 flex items-center justify-center
                        flex-shrink-0">
          {org.logoUrl ? (
            <img
              src={org.logoUrl}
              alt={org.name}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            <Building2 className="w-7 h-7 text-primary-400" />
          )}
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-bold text-surface-50 truncate">
            {org.name}
          </h2>
          <p className="text-sm text-surface-500 font-mono">
            /{org.slug}
          </p>
          {org.description && (
            <p className="text-sm text-surface-400 mt-1 line-clamp-2">
              {org.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon: Users,
            label: 'Members',
            value: org.memberCount.toString(),
            color: 'text-blue-400',
          },
          {
            icon: Crown,
            label: 'Plan',
            value: org.plan,
            color: 'text-yellow-400',
          },
          {
            icon: Calendar,
            label: 'Created',
            value: formatDate(org.createdAt),
            color: 'text-surface-400',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-900/50 rounded-xl p-3 text-center
                       border border-surface-700/50"
          >
            <stat.icon className={`w-4 h-4 mx-auto mb-1.5 ${stat.color}`} />
            <p className="text-surface-50 font-semibold text-sm">
              {stat.value}
            </p>
            <p className="text-surface-500 text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
          org.isActive ? 'bg-green-400' : 'bg-red-400'
        }`} />
        <span className="text-xs text-surface-400">
          Organization is{' '}
          <span className={org.isActive
            ? 'text-green-400 font-medium'
            : 'text-red-400 font-medium'}>
            {org.isActive ? 'Active' : 'Suspended'}
          </span>
        </span>
      </div>
    </div>
  )
}