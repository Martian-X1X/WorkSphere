import { Link } from 'react-router-dom'
import {
  FolderKanban, CheckSquare, MessageSquare,
  UserCheck, Archive, Plus, Pencil, Trash2,
  ArrowRight, AlertCircle,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelative, formatDateTime, cn } from '@/utils'
import type { ActivityLog } from '@/types'

// ── Action config map ──────────────────────────────────────────────
interface ActionConfig {
  label:     (meta: Record<string, string> | null, entityName: string) => string
  icon:      React.ElementType
  iconColor: string
  dotColor:  string
  category:  'project' | 'task' | 'comment' | 'member' | 'system'
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  // Projects
  ProjectCreated:   { label: (_, n) => `created project "${n}"`,     icon: Plus,         iconColor: 'text-green-400',  dotColor: 'bg-green-400',  category: 'project' },
  ProjectUpdated:   { label: (_, n) => `updated project "${n}"`,     icon: Pencil,       iconColor: 'text-blue-400',   dotColor: 'bg-blue-400',   category: 'project' },
  ProjectDeleted:   { label: (_, n) => `deleted project "${n}"`,     icon: Trash2,       iconColor: 'text-red-400',    dotColor: 'bg-red-400',    category: 'project' },
  ProjectArchived:  { label: (_, n) => `archived project "${n}"`,    icon: Archive,      iconColor: 'text-surface-400',dotColor: 'bg-surface-500',category: 'project' },
  ProjectStatusChanged: {
    label: (m, n) => m?.to ? `changed ${n} status to ${m.to}` : `updated ${n} status`,
    icon: ArrowRight, iconColor: 'text-yellow-400', dotColor: 'bg-yellow-400', category: 'project',
  },

  // Tasks
  TaskCreated:      { label: (_, n) => `created task "${n}"`,        icon: Plus,         iconColor: 'text-green-400',  dotColor: 'bg-green-400',  category: 'task' },
  TaskUpdated:      { label: (_, n) => `updated task "${n}"`,        icon: Pencil,       iconColor: 'text-blue-400',   dotColor: 'bg-blue-400',   category: 'task' },
  TaskDeleted:      { label: (_, n) => `deleted task "${n}"`,        icon: Trash2,       iconColor: 'text-red-400',    dotColor: 'bg-red-400',    category: 'task' },
  TaskStatusChanged: {
    label: (m, n) => m?.from && m?.to
      ? `moved "${n}" from ${m.from} → ${m.to}`
      : `changed status of "${n}"`,
    icon: ArrowRight, iconColor: 'text-primary-400', dotColor: 'bg-primary-400', category: 'task',
  },
  TaskPriorityChanged: {
    label: (m, n) => m?.from && m?.to
      ? `changed "${n}" priority ${m.from} → ${m.to}`
      : `changed priority of "${n}"`,
    icon: AlertCircle, iconColor: 'text-orange-400', dotColor: 'bg-orange-400', category: 'task',
  },
  TaskAssigned: {
    label: (m, n) => m?.assignedTo
      ? `assigned "${n}" to ${m.assignedTo}`
      : `assigned "${n}"`,
    icon: UserCheck, iconColor: 'text-yellow-400', dotColor: 'bg-yellow-400', category: 'task',
  },
  TaskUnassigned:   { label: (_, n) => `unassigned "${n}"`,          icon: UserCheck,    iconColor: 'text-surface-400',dotColor: 'bg-surface-500',category: 'task' },
  TaskCompleted:    { label: (_, n) => `completed task "${n}"`,      icon: CheckSquare,  iconColor: 'text-green-400',  dotColor: 'bg-green-400',  category: 'task' },

  // Comments
  CommentAdded:     { label: (_, n) => `commented on "${n}"`,        icon: MessageSquare,iconColor: 'text-purple-400', dotColor: 'bg-purple-400', category: 'comment' },
  CommentUpdated:   { label: (_, n) => `edited comment on "${n}"`,   icon: MessageSquare,iconColor: 'text-blue-400',   dotColor: 'bg-blue-400',   category: 'comment' },
  CommentDeleted:   { label: (_, n) => `deleted comment on "${n}"`,  icon: MessageSquare,iconColor: 'text-red-400',    dotColor: 'bg-red-400',    category: 'comment' },

  // Members
  MemberInvited:    { label: (m, _) => `invited ${m?.email ?? 'a member'}`,      icon: UserCheck, iconColor: 'text-green-400',  dotColor: 'bg-green-400',  category: 'member' },
  MemberJoined:     { label: (_, n) => `${n} joined the organization`,           icon: UserCheck, iconColor: 'text-green-400',  dotColor: 'bg-green-400',  category: 'member' },
  MemberDeactivated:{ label: (_, n) => `deactivated ${n}`,                       icon: UserCheck, iconColor: 'text-red-400',    dotColor: 'bg-red-400',    category: 'member' },
  MemberRoleChanged:{ label: (m, n) => m?.to ? `changed ${n}'s role to ${m.to}` : `changed ${n}'s role`, icon: UserCheck, iconColor: 'text-yellow-400', dotColor: 'bg-yellow-400', category: 'member' },
}

// ── Fallback config ────────────────────────────────────────────────
const DEFAULT_CONFIG: ActionConfig = {
  label:     (_, n) => `performed action on "${n}"`,
  icon:      AlertCircle,
  iconColor: 'text-surface-500',
  dotColor:  'bg-surface-600',
  category:  'system',
}

// ── Entity type → icon ─────────────────────────────────────────────
function getEntityIcon(entityType: string) {
  if (entityType === 'Project') return FolderKanban
  if (entityType === 'Task')    return CheckSquare
  if (entityType === 'Comment') return MessageSquare
  if (entityType === 'Member')  return UserCheck
  return AlertCircle
}

// ── Entity link ────────────────────────────────────────────────────
function getEntityLink(
  entityType: string,
  entityId:   string,
  projectId:  string | null
): string | null {
  if (entityType === 'Project') return `/projects/${entityId}`
  if (entityType === 'Task')    return `/tasks/${entityId}`
  if (entityType === 'Comment' && projectId) return `/projects/${projectId}`
  return null
}

interface ActivityItemProps {
  activity:  ActivityLog
  showLine?: boolean   // vertical connector line to next item
}

export function ActivityItem({ activity, showLine = true }: ActivityItemProps) {
  const meta   = activity.metadata as Record<string, string> | null
  const config = ACTION_CONFIG[activity.action] ?? DEFAULT_CONFIG
  const Icon   = config.icon
  const EntityIcon = getEntityIcon(activity.entityType)
  const entityLink = getEntityLink(
    activity.entityType,
    activity.entityId,
    activity.projectId
  )

  return (
    <div className="flex gap-3 group">
      {/* ── Left: avatar + timeline line ─────────────────── */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="relative">
          <Avatar name={activity.userName} size="md" />
          {/* Action icon badge */}
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full',
            'flex items-center justify-center',
            'bg-surface-900 border border-surface-700',
          )}>
            <Icon className={cn('w-2.5 h-2.5', config.iconColor)} />
          </div>
        </div>
        {/* Vertical connector line */}
        {showLine && (
          <div className="w-px flex-1 bg-surface-700/40 mt-1 mb-0 min-h-[24px]" />
        )}
      </div>

      {/* ── Right: content ───────────────────────────────── */}
      <div className={cn(
        'flex-1 min-w-0 pb-5',
        !showLine && 'pb-0'
      )}>
        {/* Main line */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-surface-300 leading-snug">
            <span className="font-semibold text-surface-100">
              {activity.userName}
            </span>
            {' '}
            <span className="text-surface-400">
              {config.label(meta, activity.entityName)}
            </span>
          </p>

          {/* Status dot */}
          <span className={cn(
            'w-2 h-2 rounded-full flex-shrink-0 mt-1.5',
            config.dotColor
          )} />
        </div>

        {/* Entity breadcrumb (project › task) */}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {/* Entity link */}
          {entityLink ? (
            <Link
              to={entityLink}
              className="flex items-center gap-1 text-xs text-surface-500
                         hover:text-primary-400 transition-colors"
            >
              <EntityIcon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[200px]">
                {activity.entityName}
              </span>
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-xs text-surface-600">
              <EntityIcon className="w-3 h-3" />
              {activity.entityName}
            </span>
          )}

          {/* Status change metadata pill */}
          {activity.action === 'TaskStatusChanged' && meta?.from && meta?.to && (
            <span className="text-[10px] text-surface-600 bg-surface-800
                             border border-surface-700 px-1.5 py-0.5 rounded-full">
              {meta.from} → {meta.to}
            </span>
          )}

          {/* Priority change metadata pill */}
          {activity.action === 'TaskPriorityChanged' && meta?.from && meta?.to && (
            <span className="text-[10px] text-surface-600 bg-surface-800
                             border border-surface-700 px-1.5 py-0.5 rounded-full">
              {meta.from} → {meta.to}
            </span>
          )}
        </div>

        {/* Timestamp */}
        <p
          className="text-[11px] text-surface-600 mt-1"
          title={formatDateTime(activity.createdAt)}
        >
          {formatRelative(activity.createdAt)}
        </p>
      </div>
    </div>
  )
}