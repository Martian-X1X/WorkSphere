import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { AxiosResponse } from 'axios'
import { authService } from '@/features/auth/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { registerSchema, type RegisterFormData } from '@/lib/schemas'
import { getApiError } from '@/shared/utils'
import type { ApiResponse, AuthResponse } from '@/types'

// ── Password strength indicator ────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const rules = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'One number', pass: /[0-9]/.test(password) },
    { label: 'One special character', pass: /[^A-Za-z0-9]/.test(password) },
  ]

  if (!password) return null

  return (
    <div className="space-y-1.5 mt-2">
      {rules.map((rule) => (
        <div key={rule.label} className="flex items-center gap-2">
          {rule.pass
            ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            : <XCircle className="w-3.5 h-3.5 text-surface-600 flex-shrink-0" />
          }
          <span className={`text-xs ${rule.pass ? 'text-green-400' : 'text-surface-500'}`}>
            {rule.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password', '')

  const registerMutation = useMutation<AxiosResponse<ApiResponse<AuthResponse>>, Error, RegisterFormData>({
    mutationFn: (data: RegisterFormData) =>
      authService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        organizationName: data.organizationName,
      }),
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data.data
      setAuth(user, accessToken, refreshToken)
      toast.success(`Welcome to WorkSphere, ${user.firstName}!`)
      navigate('/dashboard')
    },
    onError: (error) => {
      const message = getApiError(error)
      if (message.toLowerCase().includes('already exists')) {
        setError('email', { message: 'An account with this email already exists' })
      } else {
        toast.error(message)
      }
    },
  })

  const onSubmit = (data: RegisterFormData) => registerMutation.mutate(data)

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your 14-day free trial. No credit card required."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            autoComplete="given-name"
            placeholder="Abdul"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            placeholder="Martian"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        {/* Email */}
        <Input
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@company.io"
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Organization */}
        <Input
          label="Organization name"
          placeholder="Martian Labs"
          hint="This creates your team workspace"
          error={errors.organizationName?.message}
          {...register('organizationName')}
        />

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-300">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`input-field pr-10 ${
                errors.password ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2
                         text-surface-500 hover:text-surface-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400">⚠ {errors.password.message}</p>
          )}
          <PasswordStrength password={password} />
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-300">
            Confirm password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`input-field pr-10 ${
                errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2
                         text-surface-500 hover:text-surface-300 transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-400">
              ⚠ {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full mt-2"
          loading={registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Creating account...' : 'Create account'}
        </Button>

        {/* Login link */}
        <p className="text-center text-sm text-surface-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}