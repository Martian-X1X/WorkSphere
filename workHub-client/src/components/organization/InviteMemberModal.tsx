import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal }            from '@/components/ui/Modal'
import { Button }           from '@/components/ui/Button'
import { Input }            from '@/components/ui/Input'
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.org.invites() })
      queryClient.invalidateQueries({ queryKey: queryKeys.org.detail() })
      toast.success(`Invite sent to ${variables.email}`)
      handleClose()
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

  const handleClose = () => { reset(); onClose() }

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
            <p className="text-xs text-red-400">⚠ {errors.role.message}</p>
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
