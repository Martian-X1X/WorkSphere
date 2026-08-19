import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, UserCheck, CheckCircle2, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { organizationService } from '@/services/organization.service'
import { inviteSchema, type InviteFormData } from '@/lib/schemas'
import { getApiError, cn } from '@/utils'
import { queryKeys } from '@/lib/queryKeys'

interface InviteMemberModalProps {
  open:    boolean
  onClose: () => void
}

type Role = 'Admin' | 'Member'

const ROLE_CONFIG: {
  value:       Role
  label:       string
  description: string
}[] = [
  { value: 'Member', label: 'Member', description: 'View all + update own tasks' },
  { value: 'Admin',  label: 'Admin',  description: 'Manage team and content'     },
]

export function InviteMemberModal({ open, onClose }: InviteMemberModalProps) {
  const queryClient = useQueryClient()
  const [createdInvite, setCreatedInvite] = useState<{
    email: string
    link:  string
  } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isValid },
  } = useForm<InviteFormData>({
    resolver:       zodResolver(inviteSchema),
    mode:           'onBlur',
    defaultValues:  { email: '', role: 'Member' },
  })

  const mutation = useMutation({
    mutationFn: (data: InviteFormData) =>
      organizationService.createInvite(data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.org.invites() })
      queryClient.invalidateQueries({ queryKey: queryKeys.org.detail() })

      const inviteLink = res.data.data.inviteLink
      setCreatedInvite({ email: variables.email, link: inviteLink })
    },
    onError: (error) => {
      const message = getApiError(error)
      // If error relates to email, show it as a field error
      if (message.toLowerCase().includes('email') ||
          message.toLowerCase().includes('already') ||
          message.toLowerCase().includes('member')) {
        setError('email', { message })
      } else {
        toast.error(message)
      }
    },
  })

  const handleClose = () => {
    setCreatedInvite(null)
    reset()
    onClose()
  }

  // ── Success state: show invite link ──────────────────────────────
  if (createdInvite) {
    return (
      <Modal open={open} onClose={handleClose} title="Invite Sent!" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-900/20
                          border border-green-800/30 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-surface-100">
                Invite sent to {createdInvite.email}
              </p>
              <p className="text-xs text-surface-500 mt-0.5">
                Share the link below or they'll receive instructions
              </p>
            </div>
          </div>

          {/* Invite link */}
          <div className="space-y-1.5">
            <label className="text-xs text-surface-500">Invite link</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={createdInvite.link}
                className="input-field text-xs flex-1 text-surface-400"
              />
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(createdInvite.link)
                  toast.success('Copied!')
                }}
                className="flex-shrink-0 p-2 bg-surface-700
                           hover:bg-surface-600 rounded-lg
                           text-surface-400 hover:text-surface-200
                           transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <Button className="w-full justify-center" onClick={handleClose}>
            Done
          </Button>
        </div>
      </Modal>
    )
  }

  // ── Form state ────────────────────────────────────────────────────
  return (
    <Modal open={open} onClose={handleClose} title="Invite Team Member" size="sm">
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="space-y-5"
        noValidate
      >
        {/* Email */}
        <Input
          label="Email address"
          type="email"
          placeholder="colleague@company.io"
          error={errors.email?.message}
          autoFocus
          {...register('email')}
        />

        {/* Role selector */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-300">
            Role
          </label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {ROLE_CONFIG.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => field.onChange(r.value)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all',
                      field.value === r.value
                        ? 'border-primary-500 bg-primary-900/30 text-primary-300'
                        : 'border-surface-700 bg-surface-800/50 text-surface-400 hover:border-surface-600'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span className="font-medium text-sm">{r.label}</span>
                    </div>
                    <p className="text-xs opacity-70 leading-tight">
                      {r.description}
                    </p>
                  </button>
                ))}
              </div>
            )}
          />
          {errors.role && (
            <p className="text-xs text-red-400">{errors.role.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="secondary"
            type="button"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2"
            loading={mutation.isPending}
            disabled={!isValid || mutation.isPending}
          >
            <Mail className="w-4 h-4" />
            {mutation.isPending ? 'Sending...' : 'Send Invite'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
