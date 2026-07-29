import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Activity,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label:      string
  path:       string
  icon:       LucideIcon
  badge?:     number
  permission?: string
  adminOnly?: boolean
}

export interface NavSection {
  title?: string
  items:  NavItem[]
}

export const navSections: NavSection[] = [
  {
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Work',
    items: [
      {
        label: 'Projects',
        path: '/projects',
        icon: FolderKanban,
        permission: 'projects.view',
      },
      {
        label: 'My Tasks',
        path: '/tasks',
        icon: CheckSquare,
        permission: 'tasks.view',
      },
    ],
  },
  {
    title: 'Team',
    items: [
      {
        label: 'Members',
        path: '/members',
        icon: Users,
        permission: 'members.view',
      },
      {
        label: 'Activity',
        path: '/activity',
        icon: Activity,
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Settings',
        path: '/settings',
        icon: Settings,
        permission: 'organizations.update',
      },
    ],
  },
]
