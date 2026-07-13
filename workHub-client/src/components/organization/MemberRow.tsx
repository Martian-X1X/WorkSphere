import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Shield, UserX, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { organizationService } from '@/services/organization.service'
import { useAuthStore } from '@/stores/authStore'
import { formatRelative, getApiError } from '@/utils'
import type { Member } from '@/types'

interface MemberRowProps {
  member: Member
  onChangeRole: (member: Member) => void
}

export function MemberRow({ member, onChangeRole }: MemberRowProps) {
  const { user, isAdminOrOwner, isOwner } = useAuthStore()
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)

  const deactivateMutation = useMutation({
    mutationFn: () => organizationService.deactivateMember(member.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['org'] })
      toast.success(`${member.fullName} has been deactivated`)
    },
    onError: (error) => toast.error(getApiError(error)),
  })

  const isCurrentUser = user?.id === member.id
  const canManage = isAdminOrOwner() && !isCurrentUser && member.isActive

  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-surface-700/30
                    rounded-xl transition-colors group">
      {/* Avatar + status dot */}
      <div className="relative flex-shrink-0">
        <Avatar name={member.fullName} size="md" />
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3
                         rounded-full border-2 border-surface-800 ${
          member.isActive ? 'bg-green-400' : 'bg-surface-600'
        }`} />
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-surface-100 text-sm truncate">
            {member.fullName}
          </p>
          {isCurrentUser && (
            <span className="text-[10px] text-primary-400 font-medium
                             bg-primary-900/30 px-1.5 py-0.5 rounded-full
                             border border-primary-800/50">
              You
            </span>
          )}
          {!member.isActive && (
            <span className="text-[10px] text-surface-500 font-medium
                             bg-surface-700 px-1.5 py-0.5 rounded-full">
              Inactive
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="w-3 h-3 text-surface-600" />
          <p className="text-xs text-surface-500 truncate">{member.email}</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="hidden sm:block flex-shrink-0">
        <RoleBadge role={member.role as 'Owner' | 'Admin' | 'Member'} />
      </div>

      {/* Last login */}
      <div className="hidden lg:block text-xs text-surface-600
                      flex-shrink-0 w-24 text-right">
        {member.lastLoginAt
          ? formatRelative(member.lastLoginAt)
          : 'Never'}
      </div>

      {/* Actions menu */}
      {canManage && (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-surface-600 hover:text-surface-300
                       hover:bg-surface-700 rounded-lg transition-colors
                       opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-8 w-44 bg-surface-800
                              border border-surface-700 rounded-xl shadow-xl
                              z-20 overflow-hidden animate-fade-in">
                {/* Change role — Owner only */}
                {isOwner() && (
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onChangeRole(member)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5
                               text-sm text-surface-300 hover:text-surface-100
                               hover:bg-surface-700 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-surface-500" />
                    Change role
                  </button>
                )}

                {/* Deactivate — Owner or Admin */}
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    if (window.confirm(
                      `Deactivate ${member.fullName}? They will be immediately logged out.`
                    )) {
                      deactivateMutation.mutate()
                    }
                  }}
                  disabled={deactivateMutation.isPending}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5
                             text-sm text-red-400 hover:text-red-300
                             hover:bg-red-900/20 transition-colors"
                >
                  <UserX className="w-4 h-4" />
                  Deactivate
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}