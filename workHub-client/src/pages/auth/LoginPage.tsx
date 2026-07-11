import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { AxiosResponse } from 'axios'
import { authService } from '@/features/auth/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { loginSchema, type LoginFormData } from '@/lib/schemas'
import { getApiError } from '@/shared/utils'
import type { ApiResponse, AuthResponse } from '@/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      // ✅ Pre-fill with seed credentials for easy dev testing
      email: 'demo.owner@worksphere.io',
      password: 'Demo@Owner#2026',
    },
  })

  const loginMutation = useMutation<AxiosResponse<ApiResponse<AuthResponse>>, Error, LoginFormData>({
    mutationFn: (data: LoginFormData) => authService.login(data),
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data.data
      setAuth(user, accessToken, refreshToken)
      toast.success(`Welcome back, ${user.firstName}!`)
      navigate('/dashboard')
    },
    onError: (error) => {
      const message = getApiError(error)

      // Show field-level error for wrong credentials
      if (message.toLowerCase().includes('email or password')) {
        setError('email', { message: 'Invalid email or password' })
        setError('password', { message: 'Invalid email or password' })
      } else {
        toast.error(message)
      }
    },
  })

  const onSubmit = (data: LoginFormData) => loginMutation.mutate(data)

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your WorkSphere account"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Email */}
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.io"
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-300">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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
              {showPassword
                ? <EyeOff className="w-4 h-4" />
                : <Eye className="w-4 h-4" />
              }
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400">⚠ {errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          loading={loginMutation.isPending}
        >
          {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
        </Button>

        {/* Register link */}
        <p className="text-center text-sm text-surface-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            Create one
          </Link>
        </p>
      </form>

      {/* Dev credentials hint */}
      <div className="mt-6 p-4 rounded-lg bg-surface-900 border border-surface-700">
        <p className="text-xs text-surface-500 font-medium mb-2">
          🧪 Seed credentials (dev only):
        </p>
        <div className="space-y-1">
          {[
            { label: 'Owner', email: 'demo.owner@worksphere.io', pw: 'Demo@Owner#2026' },
            { label: 'Admin', email: 'demo.admin@worksphere.io', pw: 'Demo@Admin#2026' },
            { label: 'Member', email: 'demo.member1@worksphere.io', pw: 'Demo@Member#2026' },
          ].map((cred) => (
            <div key={cred.label} className="flex items-center gap-2 text-xs text-surface-500">
              <span className="text-surface-600 w-12">{cred.label}:</span>
              <code className="text-surface-400">{cred.email}</code>
            </div>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}