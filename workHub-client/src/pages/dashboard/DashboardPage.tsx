import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderOpen,
  Users,
} from 'lucide-react'

import { analyticsService } from '@/services/analyticsService'
import { authService } from '@/services/auth.service'
import { queryKeys } from '@/lib/queryKeys'
import { StatCard } from '@/components/analytics/StatCard'
import { TaskTrendChart } from '@/components/analytics/TaskTrendChart'
import { ProjectHealthList } from '@/components/analytics/ProjectHealthList'
import { TeamVelocityChart } from '@/components/analytics/TeamVelocityChart'
import { MyTasksPanel } from '@/components/analytics/MyTasksPanel'
import { RecentActivityFeed } from '@/components/analytics/RecentActivityFeed'
import { useAuthStore } from '@/stores/authStore'

export default function DashboardPage() {
  const { user, setPermissions } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.analytics.dashboard(30),
    queryFn: () => analyticsService.getDashboard(30),
    staleTime: 2 * 60 * 1000,
  })

  const { data: contextData } = useQuery({
    queryKey: queryKeys.auth.context(),
    queryFn: () => authService.getContext(),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (contextData?.data.data.permissions) {
      setPermissions(contextData.data.data.permissions)
    }
  }, [contextData, setPermissions])

  const stats = data?.orgStats

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-surface-100">
          Good {getGreeting()}, {user?.firstName} <span aria-hidden="true">👋</span>
        </h1>
        <p className="text-sm text-surface-500 mt-0.5">
          Here&apos;s what&apos;s happening across your workspace.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Tasks"
          value={stats?.totalTasks ?? 0}
          icon={CheckCircle2}
          color="primary"
          loading={isLoading}
        />
        <StatCard
          title="Completed"
          value={stats?.completedTasks ?? 0}
          subtitle={stats ? `${stats.completionRate}% rate` : undefined}
          icon={CheckCircle2}
          color="green"
          loading={isLoading}
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgressTasks ?? 0}
          icon={Clock}
          color="blue"
          loading={isLoading}
        />
        <StatCard
          title="Overdue"
          value={stats?.overdueTasks ?? 0}
          icon={AlertTriangle}
          color="red"
          loading={isLoading}
        />
        <StatCard
          title="Projects"
          value={stats?.activeProjects ?? 0}
          subtitle={stats ? `of ${stats.totalProjects} total` : undefined}
          icon={FolderOpen}
          color="yellow"
          loading={isLoading}
        />
        <StatCard
          title="Members"
          value={stats?.totalMembers ?? 0}
          icon={Users}
          color="primary"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TaskTrendChart data={data?.taskTrend ?? []} loading={isLoading} />
        </div>
        <ProjectHealthList
          projects={data?.projectHealth ?? []}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TeamVelocityChart data={data?.teamVelocity ?? []} loading={isLoading} />
        </div>
        <MyTasksPanel tasks={data?.myTasks ?? []} loading={isLoading} />
      </div>

      <RecentActivityFeed
        activities={data?.recentActivity ?? []}
        loading={isLoading}
      />
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
