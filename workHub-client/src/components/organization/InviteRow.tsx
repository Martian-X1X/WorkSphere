import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, Clock, X, Copy, RefreshCw, Check } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { organizationService } from '@/services/organization.service'
import { formatDate, getApiError } from '@/utils'
import { queryKeys } from '@/lib/queryKeys'
import type { Invite } from '@/types'

interface InviteRowProps {
  invite: Invite
}

export function InviteRow({ invite }: InviteRowProps) {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const isExpired = new Date(invite.expiresAt) < new Date()
  const isPending = invite.status === 'Pending' && !isExpired

  // ── Cancel mutation ───────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: () => organizationService.cancelInvite(invite.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.org.invites() })
      toast.success('Invite cancelled')
    },
    onError: (error) => toast.error(getApiError(error)),
  })

  // ── Resend mutation ───────────────────────────────────────────────
  const resendMutation = useMutation({
    mutationFn: () => organizationService.resendInvite(invite.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.org.invites() })
      toast.success('Invite resent — new link is valid for 7 days')
    },
    onError: (error) => toast.error(getApiError(error)),
  })

  // ── Copy link ─────────────────────────────────────────────────────
  const handleCopyLink = async () => {
    const inviteLink = invite.inviteLink
    if (!inviteLink) {
      toast.error('No invite link available')
      return
    }

    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast.success('Invite link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <div className="flex items-center gap-3 py-3 px-4
                    hover:bg-surface-700/20 rounded-xl transition-colors group">
      {/* Mail icon */}
      <div className="w-9 h-9 rounded-full bg-surface-700 flex items-center
                      justify-center flex-shrink-0">
        <Mail className="w-4 h-4 text-surface-400" />
      </div>

      {/* Email + meta */}
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
        isPending
          ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50'
          : 'bg-surface-700 text-surface-500 border-surface-600'
      }`}>
        {isExpired ? 'Expired' : invite.status}
      </span>

      {/* Actions — visible on hover */}
      {isPending && (
        <div className="flex items-center gap-1 opacity-0
                        group-hover:opacity-100 transition-opacity">
          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="p-1.5 text-surface-600 hover:text-surface-300
                       hover:bg-surface-700 rounded-lg transition-colors"
            title="Copy invite link"
          >
            {copied
              ? <Check className="w-3.5 h-3.5 text-green-400" />
              : <Copy  className="w-3.5 h-3.5" />}
          </button>

          {/* Resend */}
          <button
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
            className="p-1.5 text-surface-600 hover:text-blue-400
                       hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Resend invite (new link)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${
              resendMutation.isPending ? 'animate-spin' : ''
            }`} />
          </button>

          {/* Cancel */}
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="p-1.5 text-surface-600 hover:text-red-400
                       hover:bg-red-900/20 rounded-lg transition-colors"
            title="Cancel invite"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
