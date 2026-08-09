import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { Input }  from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUpdateProfile } from '@/hooks/useProfile'
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '@/lib/schemas'
import type { UserProfile } from '@/types'

interface EditProfileFormProps {
  profile: UserProfile
}

export function EditProfileForm({ profile }: EditProfileFormProps) {
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    mode:     'onBlur',
    defaultValues: {
      firstName: profile.firstName,
      lastName:  profile.lastName,
    },
  })

  // Sync form when profile changes
  useEffect(() => {
    reset({
      firstName: profile.firstName,
      lastName:  profile.lastName,
    })
  }, [profile, reset])

  const onSubmit = (data: UpdateProfileFormData) => {
    updateProfile(data)
  }

  return (
    <div className="card space-y-5">
      <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">
        Account Info
      </h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        {/* Email — read-only */}
        <Input
          label="Email address"
          value={profile.email}
          disabled
          hint="Email cannot be changed. Contact your admin to update it."
        />

        {/* Organization — read-only */}
        <Input
          label="Organization"
          value={profile.organizationName}
          disabled
        />

        {/* Role — read-only */}
        <Input
          label="Role"
          value={profile.role}
          disabled
          hint="Your role is managed by your organization owner."
        />

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            loading={isPending}
            disabled={!isDirty || isPending}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
