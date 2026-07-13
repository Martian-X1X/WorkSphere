import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  UserPlus,
  Users,
  Mail,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { OrgInfoCard } from '@/components/organization/OrgInfoCard'
import { MemberRow } from '@/components/organization/MemberRow'
import { InviteRow } from '@/components/organization/InviteRow'
import { InviteMemberModal } from '@/components/organization/InviteMemberModal'
import { ChangeRoleModal } from '@/components/organization/ChangeRoleModal'
import { organizationService } from '@/services/organization.service'
import { useAuthStore } from '@/stores/authStore'
import type { Member } from '@/types'

export default function MembersPage() {
  const { isAdminOrOwner } = useAuthStore()
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [changeRoleMember, setChangeRoleMember] = useState<Member | null>(null)
  const [search, setSearch] = useState('')

  // ── Queries ──────────────────────────────────────────────────────
  const orgQuery = useQuery({
    queryKey: ['org'],
    queryFn: () => organizationService.getMyOrg(),
    staleTime: 5 * 60 * 1000,
  })

  const membersQuery = useQuery({
    queryKey: ['members'],
    queryFn: () => organizationService.getMembers(1, 100),
    staleTime: 60 * 1000,
  })

  const invitesQuery = useQuery({
    queryKey: ['invites'],
    queryFn: () => organizationService.getInvites(),
    enabled: isAdminOrOwner(),
    staleTime: 60 * 1000,
  })

  const org = orgQuery.data?.data.data
  const members = membersQuery.data?.data.data?.items ?? []
  const invites = invitesQuery.data?.data.data ?? []

  // ── Filtered members ─────────────────────────────────────────────
  const filtered = search.trim()
    ? members.filter(m =>
        m.fullName.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
      )
    : members

  const activeMembers = filtered.filter(m => m.isActive)
  const inactiveMembers = filtered.filter(m => !m.isActive)
  const pendingInvites = invites.filter(
    i => i.status === 'Pending' &&
    new Date(i.expiresAt) > new Date()
  )

  const isLoading = orgQuery.isLoading || membersQuery.isLoading

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">
            Organization
          </h1>
          <p className="text-surface-400 mt-1 text-sm">
            Manage your team members and invitations
          </p>
        </div>

        {isAdminOrOwner() && (
          <Button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Invite Member</span>
            <span className="sm:hidden">Invite</span>
          </Button>
        )}
      </div>

      {/* ── Loading state ────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Left column — org info ────────────────────────── */}
          <div className="xl:col-span-1 space-y-4">
            {org && <OrgInfoCard org={org} />}

            {/* Quick stats */}
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-surface-300">
                Quick Stats
              </h3>
              <div className="space-y-2">
                {[
                  {
                    label: 'Active members',
                    value: activeMembers.length,
                    color: 'text-green-400',
                  },
                  {
                    label: 'Inactive members',
                    value: inactiveMembers.length,
                    color: 'text-surface-500',
                  },
                  {
                    label: 'Pending invites',
                    value: pendingInvites.length,
                    color: 'text-yellow-400',
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-surface-500">
                      {stat.label}
                    </span>
                    <span className={`text-sm font-semibold ${stat.color}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column — members + invites ─────────────── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Pending invites */}
            {isAdminOrOwner() && pendingInvites.length > 0 && (
              <div className="card space-y-1 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-yellow-400" />
                  <h2 className="font-semibold text-surface-100 text-sm">
                    Pending Invites
                  </h2>
                  <span className="ml-auto bg-yellow-900/40 text-yellow-400
                                   text-xs font-medium px-2 py-0.5 rounded-full
                                   border border-yellow-800/50">
                    {pendingInvites.length}
                  </span>
                </div>
                <div className="divide-y divide-surface-800/50">
                  {pendingInvites.map((invite) => (
                    <InviteRow key={invite.id} invite={invite} />
                  ))}
                </div>
              </div>
            )}

            {/* Members list */}
            <div className="card p-4 space-y-3">
              {/* Header + search */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-surface-400" />
                  <h2 className="font-semibold text-surface-100 text-sm">
                    Team Members
                  </h2>
                  <span className="text-xs text-surface-500">
                    ({members.length})
                  </span>
                </div>

                {/* Refresh button */}
                <button
                  onClick={() => membersQuery.refetch()}
                  disabled={membersQuery.isFetching}
                  className="ml-auto p-1.5 text-surface-600 hover:text-surface-300
                             hover:bg-surface-700 rounded-lg transition-colors"
                  title="Refresh members"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${
                    membersQuery.isFetching ? 'animate-spin' : ''
                  }`} />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2
                                   w-3.5 h-3.5 text-surface-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-8 py-1.5 text-sm"
                />
              </div>

              {/* Column headers */}
              <div className="hidden sm:grid grid-cols-[1fr,auto,auto,auto]
                             gap-3 px-4 pb-1">
                <span className="text-xs text-surface-600">Member</span>
                <span className="text-xs text-surface-600">Role</span>
                <span className="hidden lg:block text-xs text-surface-600
                                 text-right">
                  Last seen
                </span>
                <span />
              </div>

              {/* Active members */}
              {activeMembers.length > 0 ? (
                <div className="space-y-0.5">
                  {activeMembers.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      onChangeRole={setChangeRoleMember}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-surface-600 text-sm">
                  {search ? 'No members match your search' : 'No active members'}
                </div>
              )}

              {/* Inactive members (collapsed section) */}
              {inactiveMembers.length > 0 && (
                <div className="border-t border-surface-800 pt-3 mt-3">
                  <p className="text-xs text-surface-600 px-4 mb-2">
                    Deactivated ({inactiveMembers.length})
                  </p>
                  <div className="space-y-0.5 opacity-50">
                    {inactiveMembers.map((member) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        onChangeRole={setChangeRoleMember}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────── */}
      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />

      <ChangeRoleModal
        member={changeRoleMember}
        open={!!changeRoleMember}
        onClose={() => setChangeRoleMember(null)}
      />
    </div>
  )
}