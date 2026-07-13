import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, Clock, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { organizationService } from '@/services/organization.service'
import { formatDate, formatRelative, getApiError } from '@/utils'
import type { Invite } from '@/types'

interface InviteRowProps {
  invite: Invite
}

export function InviteRow({ invite }: InviteRowProps) {
  const queryClient = useQueryClient()

  const cancelMutation = useMutation({
    mutationFn: () => organizationService.cancelInvite(invite.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
      toast.success('Invite cancelled')
    },
    onError: (error) => toast.error(getApiError(error)),
  })

  const isExpired = new Date(invite.expiresAt) < new Date()

  return (
    <div className="flex items-center gap-3 py-3 px-4
                    hover:bg-surface-700/20 rounded-xl transition-colors group">
      {/* Mail icon */}
      <div className="w-9 h-9 rounded-full bg-surface-700 flex items-center
                      justify-center flex-shrink-0">
        <Mail className="w-4 h-4 text-surface-400" />
      </div>

      {/* Email */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-surface-200 truncate">
          {invite.inviteeEmail}
        </p>
        <div className="flex items-center gap-1 text-xs text-surface-500">
          <Clock className="w-3 h-3" />
          <span>
            {isExpired
              ? 'Expired'
              : `Expires ${formatDate(invite.expiresAt)}`}
          </span>
          <span className="text-surface-700">·</span>
          <span>Sent by {invite.invitedByName}</span>
        </div>
      </div>

      {/* Role */}
      <RoleBadge
        role={invite.role as 'Owner' | 'Admin' | 'Member'}
        size="sm"
      />

      {/* Status */}
      <span className={`hidden sm:inline text-xs font-medium px-2 py-0.5
                       rounded-full border ${
        invite.status === 'Pending' && !isExpired
          ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50'
          : 'bg-surface-700 text-surface-500 border-surface-600'
      }`}>
        {isExpired ? 'Expired' : invite.status}
      </span>

      {/* Cancel button */}
      {invite.status === 'Pending' && !isExpired && (
        <button
          onClick={() => cancelMutation.mutate()}
          disabled={cancelMutation.isPending}
          className="p-1.5 text-surface-600 hover:text-red-400
                     hover:bg-red-900/20 rounded-lg transition-colors
                     opacity-0 group-hover:opacity-100 flex-shrink-0"
          title="Cancel invite"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}