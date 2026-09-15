import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useChangePassword } from '@/hooks/useProfile'
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from '@/lib/schemas'
import { cn, getApiError } from '@/utils'

// Show/hide password toggle button
interface ToggleButtonProps {
  show:     boolean
  onToggle: () => void
}

function ToggleButton({ show, onToggle }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2
                 text-surface-500 hover:text-surface-300 transition-colors"
      tabIndex={-1}
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show
        ? <EyeOff className="w-4 h-4" />
        : <Eye    className="w-4 h-4" />}
    </button>
  )
}

export function ChangePasswordForm() {
  const { mutate: changePassword, isPending } = useChangePassword()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isDirty },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode:     'onBlur',
  })

  const newPassword = useWatch({ control, name: 'newPassword', defaultValue: '' }) ?? ''

  // Password strength
  const strength = [
    newPassword.length >= 8,
    /[A-Z]/.test(newPassword),
    /[a-z]/.test(newPassword),
    /[0-9]/.test(newPassword),
    /[^A-Za-z0-9]/.test(newPassword),
  ]
  const strengthCount = strength.filter(Boolean).length
  const strengthLabel =
    strengthCount <= 1 ? 'Very weak' :
    strengthCount === 2 ? 'Weak'     :
    strengthCount === 3 ? 'Fair'     :
    strengthCount === 4 ? 'Good'     :
    'Strong'

  const strengthColor =
    strengthCount <= 1 ? 'bg-red-500'    :
    strengthCount === 2 ? 'bg-orange-500' :
    strengthCount === 3 ? 'bg-yellow-500' :
    strengthCount === 4 ? 'bg-blue-500'   :
    'bg-green-500'

  const onSubmit = (data: ChangePasswordFormData) => {
    changePassword(data, {
      onSuccess: () => reset(),
      onError: (error) => {
        const msg = getApiError(error)
        if (/current|incorrect/i.test(msg)) {
          setError('currentPassword', {
            message: 'Current password is incorrect',
          })
        } else {
          toast.error(msg)
        }
      },
    })
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-surface-500" />
        <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">
          Change Password
        </h2>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        {/* Current password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-300">
            Current password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              className={cn(
                'input-field pr-10',
                errors.currentPassword && 'border-red-500/70',
              )}
              {...register('currentPassword')}
            />
            <ToggleButton
              show={showCurrent}
              onToggle={() => setShowCurrent(!showCurrent)}
            />
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-red-400 animate-fade-in">
              ⚠ {errors.currentPassword.message}
            </p>
          )}
        </div>

        {/* New password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-300">
            New password
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              className={cn(
                'input-field pr-10',
                errors.newPassword && 'border-red-500/70',
              )}
              {...register('newPassword')}
            />
            <ToggleButton
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
            />
          </div>

          {/* Strength bar */}
          {newPassword && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-all',
                      i < strengthCount ? strengthColor : 'bg-surface-700',
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-surface-500">
                Strength:{' '}
                <span className="font-medium text-surface-300">
                  {strengthLabel}
                </span>
              </p>
            </div>
          )}

          {errors.newPassword && (
            <p className="text-xs text-red-400 animate-fade-in">
              ⚠ {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-300">
            Confirm new password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              className={cn(
                'input-field pr-10',
                errors.confirmPassword && 'border-red-500/70',
              )}
              {...register('confirmPassword')}
            />
            <ToggleButton
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-400 animate-fade-in">
              ⚠ {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Policy hints */}
        <div className="p-3 bg-surface-800/50 rounded-xl border
                        border-surface-700/50 space-y-1">
          <p className="text-xs font-medium text-surface-400 mb-1.5">
            Password requirements:
          </p>
          {[
            { label: 'At least 8 characters',   met: newPassword.length >= 8 },
            { label: 'Uppercase letter (A-Z)',  met: /[A-Z]/.test(newPassword) },
            { label: 'Lowercase letter (a-z)',  met: /[a-z]/.test(newPassword) },
            { label: 'Number (0-9)',            met: /[0-9]/.test(newPassword) },
            { label: 'Special character',       met: /[^A-Za-z0-9]/.test(newPassword) },
          ].map((req) => (
            <div key={req.label} className="flex items-center gap-2">
              <ShieldCheck className={cn(
                'w-3 h-3 flex-shrink-0',
                req.met ? 'text-green-400' : 'text-surface-600',
              )} />
              <span className={cn(
                'text-xs',
                req.met ? 'text-surface-300' : 'text-surface-600',
              )}>
                {req.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={isPending}
            disabled={!isDirty || isPending}
            className="flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {isPending ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </form>
    </div>
  )
}
