import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CheckCircle2, XCircle, Clock,
  Eye, EyeOff, ShieldCheck,
  Building2, UserCheck, ArrowRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { Spinner } from '@/components/ui/Spinner'
import { organizationService } from '@/services/organization.service'
import { useAuthStore } from '@/stores/authStore'
import { acceptInviteSchema, type AcceptInviteFormData } from '@/lib/schemas'
import { formatDate, cn } from '@/utils'

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  // ── Fetch invite preview ──────────────────────────────────────────
  const {
    data: preview,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => organizationService.previewInvite(token!),
    enabled: !!token,
    retry: false,
    select: (res) => res.data.data,
  })

  // ── Accept mutation ───────────────────────────────────────────────
  const acceptMutation = useMutation({
    mutationFn: (data: AcceptInviteFormData) =>
      organizationService.acceptInvite(token!, {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        password: data.password,
      }),
    onSuccess: (res) => {
      const { accessToken, refreshToken, user } = res.data.data
      setAuth(user, accessToken, refreshToken)
      toast.success(`Welcome to ${preview?.organizationName}!`)
      navigate('/dashboard', { replace: true })
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      const msg = err.response?.data?.message ?? 'Failed to accept invite'
      toast.error(msg)
    },
  })

  // ── Form ──────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
    mode: 'onBlur',
  })

  const password = watch('password') ?? ''
  const strengthItems = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number (0-9)', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ]
  const strengthCount = strengthItems.filter((s) => s.met).length
  const strengthColor =
    strengthCount <= 1 ? 'bg-red-500' :
    strengthCount <= 2 ? 'bg-orange-500' :
    strengthCount <= 3 ? 'bg-yellow-500' :
    strengthCount <= 4 ? 'bg-blue-500' :
    'bg-green-500'

  // ── Loading ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <InviteShell>
        <div className="flex flex-col items-center py-12">
          <Spinner size="lg" label="Loading invite..." />
        </div>
      </InviteShell>
    )
  }

  // ── Invalid token ─────────────────────────────────────────────────
  if (error || !preview) {
    return (
      <InviteShell>
        <StateCard
          icon={XCircle}
          iconColor="text-red-400"
          iconBg="bg-red-900/20 border-red-800/30"
          title="Invalid invite link"
          description="This invite link is invalid or doesn't exist. Please contact your administrator for a new invite."
        />
      </InviteShell>
    )
  }

  // ── Already accepted ──────────────────────────────────────────────
  if (preview.isAlreadyAccepted) {
    return (
      <InviteShell>
        <StateCard
          icon={CheckCircle2}
          iconColor="text-green-400"
          iconBg="bg-green-900/20 border-green-800/30"
          title="Invite already accepted"
          description="This invite has already been used to create an account. If that was you, please sign in."
          action={
            <Link
              to="/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                         bg-primary-600 hover:bg-primary-500 text-white
                         text-sm font-medium transition-colors"
            >
              Sign in <ArrowRight className="w-4 h-4" />
            </Link>
          }
        />
      </InviteShell>
    )
  }

  // ── Expired ───────────────────────────────────────────────────────
  if (preview.isExpired) {
    return (
      <InviteShell>
        <StateCard
          icon={Clock}
          iconColor="text-yellow-400"
          iconBg="bg-yellow-900/20 border-yellow-800/30"
          title="Invite has expired"
          description={`This invite expired on ${formatDate(preview.expiresAt)}. Please ask ${preview.invitedByName} to send a new invite.`}
        />
      </InviteShell>
    )
  }

  // ── Valid invite — show form ───────────────────────────────────────
  return (
    <InviteShell>
      <div className="space-y-6">

        {/* Invite info card */}
        <div className="bg-surface-800/60 border border-surface-700/50
                        rounded-2xl p-5 space-y-3">
          {/* Headline */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-surface-50">
              You've been invited!
            </h2>
            <p className="text-sm text-surface-400">
              <span className="text-surface-200 font-medium">
                {preview.invitedByName}
              </span>
              {' '}invited you to join
            </p>
          </div>

          {/* Org + role */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl
                            bg-surface-700/50 border border-surface-600/50">
              <Building2 className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-semibold text-surface-100">
                {preview.organizationName}
              </span>
            </div>

            <span className="text-surface-600 text-sm">as</span>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl
                            bg-surface-700/50 border border-surface-600/50">
              <UserCheck className="w-4 h-4 text-surface-400" />
              <RoleBadge
                role={preview.role as 'Owner' | 'Admin' | 'Member'}
              />
            </div>
          </div>

          {/* Expiry */}
          <p className="text-center text-xs text-surface-600">
            Expires {formatDate(preview.expiresAt)}
          </p>
        </div>

        {/* Accept form */}
        <form
          onSubmit={handleSubmit((d) => acceptMutation.mutate(d))}
          className="space-y-4"
          noValidate
        >
          <h3 className="text-sm font-semibold text-surface-300">
            Create your account
          </h3>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              placeholder="John"
              error={errors.firstName?.message}
              autoFocus
              {...register('firstName')}
            />
            <Input
              label="Last name"
              placeholder="Smith"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                className={cn(
                  'input-field pr-10',
                  errors.password && 'border-red-500/70 focus:ring-red-500/30',
                )}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-surface-500 hover:text-surface-300
                           transition-colors"
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye    className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength bar */}
            {password && (
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
              </div>
            )}

            {errors.password && (
              <p className="text-xs text-red-400 animate-fade-in">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Password requirements */}
          {password && (
            <div className="p-3 bg-surface-800/50 rounded-xl border
                            border-surface-700/50 space-y-1">
              {strengthItems.map((req) => (
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
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full justify-center gap-2"
            loading={acceptMutation.isPending}
            disabled={acceptMutation.isPending}
          >
            <CheckCircle2 className="w-4 h-4" />
            {acceptMutation.isPending
              ? 'Creating account...'
              : `Accept & Join ${preview.organizationName}`}
          </Button>
        </form>

        {/* Already have account link */}
        <p className="text-center text-sm text-surface-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-400 hover:text-primary-300
                       transition-colors font-medium"
          >
            Sign in instead
          </Link>
        </p>
      </div>
    </InviteShell>
  )
}

// ── Shared shell (logo + centered card) ───────────────────────────
function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col
                    items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-primary-600
                        flex items-center justify-center">
          <span className="text-white font-black text-sm">W</span>
        </div>
        <span className="text-xl font-bold text-surface-50">
          WorkSphere
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-surface-900 border
                      border-surface-700/50 rounded-2xl p-6
                      shadow-2xl shadow-black/40">
        {children}
      </div>
    </div>
  )
}

// ── Reusable state card (expired/invalid/accepted) ─────────────────
interface StateCardProps {
  icon: React.ElementType
  iconColor: string
  iconBg: string
  title: string
  description: string
  action?: React.ReactNode
}

function StateCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  action,
}: StateCardProps) {
  return (
    <div className="flex flex-col items-center text-center py-6 space-y-4">
      <div className={cn(
        'w-16 h-16 rounded-2xl flex items-center justify-center border',
        iconBg,
      )}>
        <Icon className={cn('w-8 h-8', iconColor)} />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-surface-100">{title}</h2>
        <p className="text-sm text-surface-400 max-w-xs">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
