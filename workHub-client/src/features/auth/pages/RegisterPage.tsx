import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useState } from 'react'
import { ROUTES } from '@/router/routes'
import { Button, Input } from '@/shared/components/ui'
import { useRegister } from '@/features/auth/hooks'
import {
  registerSchema,
  type RegisterFormData,
} from '@/features/auth/auth.schema'

export default function RegisterPage() {
  const registerMutation = useRegister()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      organizationName: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword: _, ...payload } = data
    void _
    registerMutation.mutate(payload)
  }

  return (
    <div className="card p-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-surface-50">
          Create your workspace
        </h1>
        <p className="text-sm text-surface-400">
          Start managing projects with your team
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="John"
            autoComplete="given-name"
            icon={User}
            error={errors.firstName?.message}
            {...register('firstName')}
          />

          <Input
            label="Last Name"
            placeholder="Doe"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <Input
          label="Work Email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Organization Name"
          placeholder="Acme Corporation"
          autoComplete="organization"
          icon={Building2}
          error={errors.organizationName?.message}
          {...register('organizationName')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            autoComplete="new-password"
            icon={Lock}
            error={errors.password?.message}
            hint="Min 8 chars with uppercase, lowercase, digit, and special character"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-9 text-surface-500 hover:text-surface-300 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          icon={Lock}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={registerMutation.isPending}
          className="mt-2"
        >
          Create Account
          {!registerMutation.isPending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="text-center text-xs text-surface-500">
        By creating an account, you agree to our{' '}
        <span className="text-surface-400">Terms of Service</span> and{' '}
        <span className="text-surface-400">Privacy Policy</span>
      </p>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-surface-800 px-3 text-surface-500">or</span>
        </div>
      </div>

      <p className="text-center text-sm text-surface-400">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
