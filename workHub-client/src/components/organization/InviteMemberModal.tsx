import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { organizationService } from '@/services/organization.service'
import { getApiError } from '@/utils'

interface InviteMemberModalProps {
  open: boolean
  onClose: () => void
}

type Role = 'Admin' | 'Member'

export function InviteMemberModal({ open, onClose }: InviteMemberModalProps) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('Member')
  const [emailError, setEmailError] = useState('')

  const inviteMutation = useMutation({
    mutationFn: () =>
      organizationService.createInvite({ email: email.trim(), role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
      queryClient.invalidateQueries({ queryKey: ['org'] })
      toast.success(`Invite sent to ${email}`)
      handleClose()
    },
    onError: (error) => {
      const message = getApiError(error)
      if (message.toLowerCase().includes('email') ||
          message.toLowerCase().includes('already')) {
        setEmailError(message)
      } else {
        toast.error(message)
      }
    },
  })

  const handleClose = () => {
    setEmail('')
    setRole('Member')
    setEmailError('')
    onClose()
  }

  const handleSubmit = () => {
    setEmailError('')

    if (!email.trim()) {
      setEmailError('Email is required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Invalid email address')
      return
    }

    inviteMutation.mutate()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Invite Team Member" size="sm">
      <div className="space-y-5">
        {/* Email */}
        <Input
          label="Email address"
          type="email"
          placeholder="colleague@company.io"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setEmailError('')
          }}
          error={emailError}
          autoFocus
        />

        {/* Role selector */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-300">
            Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['Member', 'Admin'] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === r
                    ? 'border-primary-500 bg-primary-900/30 text-primary-300'
                    : 'border-surface-700 bg-surface-800/50 text-surface-400 hover:border-surface-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="font-medium text-sm">{r}</span>
                </div>
                <p className="text-xs opacity-70 leading-tight">
                  {r === 'Admin'
                    ? 'Manage team & content'
                    : 'View + update own tasks'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 flex items-center justify-center gap-2"
            onClick={handleSubmit}
            loading={inviteMutation.isPending}
          >
            <Mail className="w-4 h-4" />
            {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}