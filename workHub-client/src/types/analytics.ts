export interface DashboardAnalytics {
  orgStats: OrgStats
  taskTrend: TaskTrendPoint[]
  projectHealth: ProjectHealth[]
  teamVelocity: TeamVelocityMember[]
  myTasks: MyTask[]
  recentActivity: RecentActivity[]
}

export interface OrgStats {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  inProgressTasks: number
  totalProjects: number
  activeProjects: number
  totalMembers: number
  completionRate: number
}

export interface TaskTrendPoint {
  date: string
  created: number
  completed: number
}

export interface ProjectHealth {
  projectId: string
  projectName: string
  color: string
  totalTasks: number
  doneTasks: number
  overdueTasks: number
  progress: number
  status: 'OnTrack' | 'AtRisk' | 'Behind'
}

export interface TeamVelocityMember {
  userId: string
  fullName: string
  avatar: string
  completed: number
  inProgress: number
  assigned: number
}

export interface MyTask {
  taskId: string
  title: string
  projectName: string
  projectId: string
  status: string
  priority: string
  dueDate: string | null
  isOverdue: boolean
}

export interface RecentActivity {
  id: string
  actorName: string
  actorAvatar: string
  action: string
  entityType: string
  entityName: string
  projectName: string
  actionUrl: string | null
  createdAt: string
}
