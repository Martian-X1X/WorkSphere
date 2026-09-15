import { useState }           from 'react'
import { Link }               from 'react-router-dom'
import { useForm }            from 'react-hook-form'
import { zodResolver }        from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2, Shield, Bell, Palette,
  Save, ArrowRight,
} from 'lucide-react'
import toast                  from 'react-hot-toast'
import { Input }              from '@/components/ui/Input'
import { Button }             from '@/components/ui/Button'
import { Can }                from '@/components/ui/Can'
import { useOrganization }    from '@/hooks/useOrganization'
import { organizationService } from '@/services/organization.service'
import { orgUpdateSchema, type OrgUpdateFormData } from '@/lib/schemas'
import { queryKeys }          from '@/lib/queryKeys'
import { getApiError }        from '@/utils'

// ── Settings sections ──────────────────────────────────────────────
const SECTIONS = [
  { id: 'org',        label: 'Organization', icon: Building2 },
  { id: 'security',   label: 'Security',     icon: Shield    },
  { id: 'notifs',     label: 'Notifications', icon: Bell     },
  { id: 'appearance', label: 'Appearance',   icon: Palette   },
] as const

type Section = typeof SECTIONS[number]['id']

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('org')

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">

      {/* ── Header ───────────────────────────────────────── */}
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">
          Manage your organization and account preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* ── Sidebar nav ─────────────────────────────── */}
        <nav className="md:col-span-1">
          <div className="card p-2 space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5
                            rounded-xl text-sm font-medium transition-colors
                            text-left ${
                  activeSection === id
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700/50'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* ── Content ─────────────────────────────────── */}
        <div className="md:col-span-3">
          {activeSection === 'org'        && <OrgSettings />}
          {activeSection === 'security'   && <SecuritySettings />}
          {activeSection === 'notifs'     && <NotificationSettings />}
          {activeSection === 'appearance' && <AppearanceSettings />}
        </div>
      </div>
    </div>
  )
}

// ── Organization settings ──────────────────────────────────────────
function OrgSettings() {
  const queryClient            = useQueryClient()
  const { data: org, isLoading } = useOrganization()

  const { register, handleSubmit, formState: { errors, isDirty } } =
    useForm<OrgUpdateFormData>({
      resolver: zodResolver(orgUpdateSchema),
      values: {
        name:        org?.name        ?? '',
        description: org?.description ?? '',
        logoUrl:     org?.logoUrl     ?? '',
      },
    })

  const mutation = useMutation({
    mutationFn: (data: OrgUpdateFormData) =>
      organizationService.updateMyOrg({
        name:        data.name,
        description: data.description,
        logoUrl:     data.logoUrl || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.org.detail() })
      toast.success('Organization updated!')
    },
    onError: (error) => toast.error(getApiError(error)),
  })

  if (isLoading) {
    return (
      <div className="card space-y-4 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 bg-surface-700 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2 pb-2 border-b border-surface-700/50">
        <Building2 className="w-4 h-4 text-surface-500" />
        <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">
          Organization
        </h2>
      </div>

      <Can
        permission="organizations.update"
        fallback={
          <p className="text-sm text-surface-500 italic">
            Only the Organization Owner can update these settings.
          </p>
        }
      >
        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Organization name"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-300">
              Description
              <span className="text-surface-600 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              rows={3}
              className="input-field resize-none"
              placeholder="What does your organization do?"
              {...register('description')}
            />
          </div>

          <Input
            label="Logo URL"
            optional
            placeholder="https://example.com/logo.png"
            error={errors.logoUrl?.message}
            hint="Public URL to your organization's logo"
            {...register('logoUrl')}
          />

          {/* Org slug — read only */}
          <Input
            label="Organization slug"
            value={org?.slug ?? ''}
            disabled
            hint="Slug cannot be changed after creation"
          />

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              loading={mutation.isPending}
              disabled={!isDirty || mutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </Can>
    </div>
  )
}

// ── Security settings ──────────────────────────────────────────────
function SecuritySettings() {
  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2 pb-2 border-b border-surface-700/50">
        <Shield className="w-4 h-4 text-surface-500" />
        <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">
          Security
        </h2>
      </div>

      <div className="space-y-4">
        {/* Change password link */}
        <div className="flex items-center justify-between p-4 rounded-xl
                        bg-surface-800/50 border border-surface-700/50">
          <div>
            <p className="text-sm font-medium text-surface-200">Password</p>
            <p className="text-xs text-surface-500 mt-0.5">
              Change your account password
            </p>
          </div>
          <Link
            to="/profile"
            className="flex items-center gap-1.5 text-sm text-primary-400
                       hover:text-primary-300 transition-colors"
          >
            Update <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Active sessions — placeholder */}
        <div className="flex items-center justify-between p-4 rounded-xl
                        bg-surface-800/50 border border-surface-700/50">
          <div>
            <p className="text-sm font-medium text-surface-200">
              Active Sessions
            </p>
            <p className="text-xs text-surface-500 mt-0.5">
              Manage where you're signed in
            </p>
          </div>
          <span className="text-xs text-surface-600 italic">
            Coming Day 80
          </span>
        </div>

        {/* Two-factor — placeholder */}
        <div className="flex items-center justify-between p-4 rounded-xl
                        bg-surface-800/50 border border-surface-700/50">
          <div>
            <p className="text-sm font-medium text-surface-200">
              Two-Factor Authentication
            </p>
            <p className="text-xs text-surface-500 mt-0.5">
              Add an extra layer of security
            </p>
          </div>
          <span className="text-xs text-surface-600 italic">
            Coming Day 80
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Notification settings ──────────────────────────────────────────
function NotificationSettings() {
  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2 pb-2 border-b border-surface-700/50">
        <Bell className="w-4 h-4 text-surface-500" />
        <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">
          Notifications
        </h2>
      </div>

      <div className="space-y-3">
        {[
          { label: 'Task assignments',  sub: 'When someone assigns you a task'  },
          { label: 'Task comments',     sub: 'When someone comments on your task'},
          { label: 'Project updates',   sub: 'When new projects are created'     },
          { label: 'Member activity',   sub: 'When members join or leave'        },
        ].map((pref) => (
          <div key={pref.label}
               className="flex items-center justify-between p-4 rounded-xl
                          bg-surface-800/50 border border-surface-700/50">
            <div>
              <p className="text-sm font-medium text-surface-200">{pref.label}</p>
              <p className="text-xs text-surface-500 mt-0.5">{pref.sub}</p>
            </div>
            {/* Toggle placeholder */}
            <div className="w-10 h-6 bg-primary-600 rounded-full
                            relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute
                              right-1 top-1 shadow-sm" />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-surface-600 italic">
        Notification preferences — fully functional in Day 69
      </p>
    </div>
  )
}

// ── Appearance settings ────────────────────────────────────────────
function AppearanceSettings() {
  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2 pb-2 border-b border-surface-700/50">
        <Palette className="w-4 h-4 text-surface-500" />
        <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">
          Appearance
        </h2>
      </div>

      {/* Theme */}
      <div>
        <p className="text-sm font-medium text-surface-300 mb-3">Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Dark',    active: true,  bg: 'bg-surface-900 border-primary-500' },
            { label: 'Light',   active: false, bg: 'bg-gray-100 border-surface-600' },
            { label: 'System',  active: false, bg: 'bg-gradient-to-br from-surface-900 to-gray-100 border-surface-600' },
          ].map((theme) => (
            <button
              key={theme.label}
              disabled={!theme.active}
              className={`p-4 rounded-xl border-2 text-center
                          transition-colors ${theme.bg} ${
                theme.active
                  ? 'cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <p className={`text-xs font-medium ${
                theme.active ? 'text-surface-100' : 'text-surface-500'
              }`}>
                {theme.label}
              </p>
              {theme.active && (
                <p className="text-[10px] text-primary-400 mt-0.5">Active</p>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-surface-600 mt-2 italic">
          Light theme coming Day 80
        </p>
      </div>

      {/* Density */}
      <div>
        <p className="text-sm font-medium text-surface-300 mb-3">
          Display density
        </p>
        <div className="grid grid-cols-3 gap-3">
          {['Compact', 'Default', 'Comfortable'].map((d) => (
            <button
              key={d}
              disabled={d !== 'Default'}
              className={`px-3 py-2 rounded-xl border text-xs font-medium
                          transition-colors ${
                d === 'Default'
                  ? 'border-primary-500 bg-primary-900/20 text-primary-400'
                  : 'border-surface-700 text-surface-600 opacity-40 cursor-not-allowed'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}