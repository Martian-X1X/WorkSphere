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
  label: string
  path: string
  icon: LucideIcon
  badge?: number        // notification count
  adminOnly?: boolean   // hide from Members
}

export interface NavSection {
  title?: string        // section header (optional)
  items: NavItem[]
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
      },
      {
        label: 'My Tasks',
        path: '/tasks',
        icon: CheckSquare,
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
        adminOnly: true,
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
        adminOnly: true,
      },
    ],
  },
]