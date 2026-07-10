import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { ROUTES } from '@/router/routes'
import { Button, Input, FormError } from '@/shared/components/ui'
import { useLogin } from '@/features/auth/hooks'
import { loginSchema, type LoginFormData } from '@/features/auth/auth.schema'
import { getApiError } from '@/shared/utils'

export default function LoginPage() {
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (data: LoginFormData) => {
    login.mutate(data)
  }

  return (
    <div className="card p-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-surface-50">
          Welcome back
        </h1>
        <p className="text-sm text-surface-400">
          Sign in to your WorkSphere account
        </p>
      </div>

      <FormError message={login.isError ? getApiError(login.error) : undefined} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          icon={Lock}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={login.isPending}
          className="mt-2"
        >
          Sign In
          {!login.isPending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-surface-800 px-3 text-surface-500">or</span>
        </div>
      </div>

      <p className="text-center text-sm text-surface-400">
        Don&apos;t have an account?{' '}
        <Link
          to={ROUTES.REGISTER}
          className="font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          Create one free
        </Link>
      </p>
    </div>
  )
}
