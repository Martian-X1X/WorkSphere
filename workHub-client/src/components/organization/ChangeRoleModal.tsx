import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { organizationService } from '@/services/organization.service'
import { getApiError } from '@/utils'
import type { Member } from '@/types'

interface ChangeRoleModalProps {
  member: Member | null
  open: boolean
  onClose: () => void
}

type Role = 'Owner' | 'Admin' | 'Member'

const ROLES: { value: Role; label: string; description: string }[] = [
  {
    value: 'Owner',
    label: 'Owner',
    description: 'Full control — billing, settings, all data',
  },
  {
    value: 'Admin',
    label: 'Admin',
    description: 'Manage team and content, no billing',
  },
  {
    value: 'Member',
    label: 'Member',
    description: 'View all, update own tasks only',
  },
]

export function ChangeRoleModal({
  member,
  open,
  onClose,
}: ChangeRoleModalProps) {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<Role>(
    (member?.role as Role) ?? 'Member'
  )

  const mutation = useMutation({
    mutationFn: () =>
      organizationService.changeMemberRole(member!.id, {
        role: selectedRole,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success(`${member?.fullName}'s role updated to ${selectedRole}`)
      onClose()
    },
    onError: (error) => toast.error(getApiError(error)),
  })

  if (!member) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change Member Role"
      size="sm"
    >
      <div className="space-y-5">
        {/* Member info */}
        <div className="flex items-center gap-3 p-3 bg-surface-800
                        rounded-xl border border-surface-700">
          <Avatar name={member.fullName} size="md" />
          <div className="min-w-0">
            <p className="font-medium text-surface-100 truncate">
              {member.fullName}
            </p>
            <p className="text-xs text-surface-500 truncate">{member.email}</p>
          </div>
        </div>

        {/* Role options */}
        <div className="space-y-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => setSelectedRole(r.value)}
              className={`w-full p-3 rounded-xl border text-left
                         transition-all ${
                selectedRole === r.value
                  ? 'border-primary-500 bg-primary-900/30'
                  : 'border-surface-700 bg-surface-800/50 hover:border-surface-600'
              }`}
            >
              <p className={`font-medium text-sm ${
                selectedRole === r.value
                  ? 'text-primary-300'
                  : 'text-surface-300'
              }`}>
                {r.label}
              </p>
              <p className="text-xs text-surface-500 mt-0.5">
                {r.description}
              </p>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={selectedRole === member.role}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}