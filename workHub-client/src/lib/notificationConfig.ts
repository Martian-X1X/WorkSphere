import {
  Bell,
  CheckSquare,
  MessageSquare,
  UserPlus,
  FolderKanban,
  UserCheck,
  Mail,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'

// ── Per-type display config ────────────────────────────────────────
interface NotificationConfig {
  icon:      LucideIcon
  iconColor: string
  iconBg:    string
}

export const NOTIFICATION_CONFIG: Record<string, NotificationConfig> = {
  // Tasks
  TaskAssigned: {
    icon:      CheckSquare,
    iconColor: 'text-blue-400',
    iconBg:    'bg-blue-900/30',
  },
  TaskStatusChanged: {
    icon:      CheckSquare,
    iconColor: 'text-green-400',
    iconBg:    'bg-green-900/30',
  },
  TaskCompleted: {
    icon:      CheckSquare,
    iconColor: 'text-green-400',
    iconBg:    'bg-green-900/30',
  },
  TaskDueSoon: {
    icon:      AlertCircle,
    iconColor: 'text-yellow-400',
    iconBg:    'bg-yellow-900/30',
  },
  TaskOverdue: {
    icon:      AlertCircle,
    iconColor: 'text-red-400',
    iconBg:    'bg-red-900/30',
  },

  // Comments
  CommentAdded: {
    icon:      MessageSquare,
    iconColor: 'text-purple-400',
    iconBg:    'bg-purple-900/30',
  },
  CommentMention: {
    icon:      MessageSquare,
    iconColor: 'text-purple-400',
    iconBg:    'bg-purple-900/30',
  },

  // Projects
  ProjectCreated: {
    icon:      FolderKanban,
    iconColor: 'text-primary-400',
    iconBg:    'bg-primary-900/30',
  },
  ProjectStatusChanged: {
    icon:      FolderKanban,
    iconColor: 'text-yellow-400',
    iconBg:    'bg-yellow-900/30',
  },

  // Members
  MemberJoined: {
    icon:      UserPlus,
    iconColor: 'text-green-400',
    iconBg:    'bg-green-900/30',
  },
  InviteAccepted: {
    icon:      Mail,
    iconColor: 'text-green-400',
    iconBg:    'bg-green-900/30',
  },
  RoleChanged: {
    icon:      UserCheck,
    iconColor: 'text-yellow-400',
    iconBg:    'bg-yellow-900/30',
  },
}

// Fallback for unknown types
export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  icon:      Bell,
  iconColor: 'text-surface-400',
  iconBg:    'bg-surface-700',
}

export function getNotificationConfig(type: string): NotificationConfig {
  return NOTIFICATION_CONFIG[type] ?? DEFAULT_NOTIFICATION_CONFIG
}
