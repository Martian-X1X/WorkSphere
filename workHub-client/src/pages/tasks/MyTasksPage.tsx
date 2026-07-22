import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckSquare, AlertCircle, Clock,
  Calendar, Search, RefreshCw,
  ListChecks,
} from 'lucide-react'
import { StatsCard }      from '@/components/ui/StatsCard'
import { EmptyState }     from '@/components/ui/EmptyState'
import { QueryError }     from '@/components/ui/QueryError'
import { TaskRowSkeleton } from '@/components/task/TaskRowSkeleton'
import { MyTaskRow }       from '@/components/task/MyTaskRow'
import { EditTaskModal }   from '@/components/task/EditTaskModal'
import { useMyTasks }      from '@/hooks/useTasks'
import { useAuthStore }    from '@/stores/authStore'
import { isOverdue, cn }   from '@/utils'
import type { Task }       from '@/types'

// ── Filter config ──────────────────────────────────────────────────
const STATUS_FILTERS = [
  { label: 'All',         value: '' },
  { label: 'Todo',        value: 'Todo' },
  { label: 'In Progress', value: 'InProgress' },
  { label: 'In Review',   value: 'InReview' },
  { label: 'Done',        value: 'Done' },
  { label: 'Cancelled',   value: 'Cancelled' },
]

const PRIORITY_FILTERS = [
  { label: 'All Priorities', value: '' },
  { label: 'Urgent',         value: 'Urgent' },
  { label: 'High',           value: 'High' },
  { label: 'Medium',         value: 'Medium' },
  { label: 'Low',            value: 'Low' },
]

export default function MyTasksPage() {
  const { user } = useAuthStore()

  // ── Filter state ─────────────────────────────────────────────────
  const [statusFilter,   setStatusFilter]   = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [overdueOnly,    setOverdueOnly]    = useState(false)
  const [search,         setSearch]         = useState('')
  const [editTask,       setEditTask]       = useState<Task | null>(null)

  // ── Data ─────────────────────────────────────────────────────────
  const {
    data:      allTasks,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useMyTasks({
    status:   statusFilter   || undefined,
    priority: priorityFilter || undefined,
  })

  // ── Client-side filtering (search + overdue) ──────────────────────
  const filteredTasks = useMemo(() => {
    let tasks = allTasks ?? []

    if (search.trim()) {
      const q = search.toLowerCase()
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.projectName?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
    }

    if (overdueOnly) {
      tasks = tasks.filter(t => isOverdue(t.dueDate, t.status))
    }

    return tasks
  }, [allTasks, search, overdueOnly])

  // ── Stats (computed from ALL tasks, ignoring filters) ─────────────
  const stats = useMemo(() => {
    const all = allTasks ?? []
    return {
      total:   all.length,
      todo:    all.filter(t => t.status === 'Todo').length,
      inProg:  all.filter(t => t.status === 'InProgress').length,
      done:    all.filter(t => t.status === 'Done').length,
      overdue: all.filter(t => isOverdue(t.dueDate, t.status)).length,
      dueToday: all.filter(t => {
        if (!t.dueDate) return false
        const due  = new Date(t.dueDate)
        const today = new Date()
        return (
          due.getFullYear() === today.getFullYear() &&
          due.getMonth()    === today.getMonth() &&
          due.getDate()     === today.getDate() &&
          t.status !== 'Done' &&
          t.status !== 'Cancelled'
        )
      }).length,
    }
  }, [allTasks])

  // ── Group filtered tasks by project ───────────────────────────────
  const groupedTasks = useMemo(() => {
    const groups: Record<string, { projectName: string; tasks: Task[] }> = {}
    for (const task of filteredTasks) {
      const key = task.projectId
      if (!groups[key]) {
        groups[key] = { projectName: task.projectName ?? 'Unknown Project', tasks: [] }
      }
      groups[key].tasks.push(task)
    }
    return Object.entries(groups)
      .sort(([, a], [, b]) => a.projectName.localeCompare(b.projectName))
  }, [filteredTasks])

  const hasFilters = !!(statusFilter || priorityFilter || search || overdueOnly)

  // ── Error state ───────────────────────────────────────────────────
  if (error) {
    return (
      <QueryError
        error={error}
        onRetry={refetch}
        title="Failed to load your tasks"
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">My Tasks</h1>
          <p className="text-surface-400 mt-1 text-sm">
            {isLoading
              ? 'Loading your tasks...'
              : stats.total === 0
              ? 'No tasks assigned to you'
              : `${stats.total} task${stats.total !== 1 ? 's' : ''} assigned to you`}
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 border border-surface-700 rounded-lg text-surface-500
                     hover:text-surface-300 hover:border-surface-600
                     bg-surface-800/50 transition-colors flex-shrink-0"
          title="Refresh"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* ── Stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard
          icon={ListChecks}
          label="Total assigned"
          value={stats.total}
          color="text-surface-300"
          loading={isLoading}
        />
        <StatsCard
          icon={Clock}
          label="In progress"
          value={stats.inProg}
          color="text-blue-400"
          bgColor="bg-blue-950/20"
          loading={isLoading}
        />
        <StatsCard
          icon={AlertCircle}
          label="Overdue"
          value={stats.overdue}
          color={stats.overdue > 0 ? 'text-red-400' : 'text-surface-500'}
          bgColor={stats.overdue > 0 ? 'bg-red-950/20' : 'bg-surface-800/50'}
          loading={isLoading}
        />
        <StatsCard
          icon={Calendar}
          label="Due today"
          value={stats.dueToday}
          color={stats.dueToday > 0 ? 'text-yellow-400' : 'text-surface-500'}
          bgColor={stats.dueToday > 0 ? 'bg-yellow-950/20' : 'bg-surface-800/50'}
          loading={isLoading}
        />
      </div>

      {/* ── Filter bar ──────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((f) => {
            // Count per status from allTasks
            const count = (allTasks ?? []).filter(t =>
              f.value === '' ? true : t.status === f.value
            ).length

            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm',
                  'font-medium whitespace-nowrap transition-colors flex-shrink-0',
                  statusFilter === f.value
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-700/50'
                    : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800',
                )}
              >
                {f.label}
                {count > 0 && (
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                    statusFilter === f.value
                      ? 'bg-primary-700/50 text-primary-300'
                      : 'bg-surface-700 text-surface-500',
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search + priority + overdue */}
        <div className="flex gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2
                               w-4 h-4 text-surface-500" />
            <input
              type="text"
              placeholder="Search tasks or projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 w-full"
            />
          </div>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input-field w-auto cursor-pointer"
          >
            {PRIORITY_FILTERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {/* Overdue toggle */}
          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
              'font-medium transition-colors',
              overdueOnly
                ? 'bg-red-900/30 border-red-800/50 text-red-400'
                : 'border-surface-700 text-surface-500 hover:border-surface-600',
            )}
          >
            <AlertCircle className="w-4 h-4" />
            Overdue only
            {stats.overdue > 0 && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                overdueOnly
                  ? 'bg-red-800/50 text-red-300'
                  : 'bg-surface-700 text-surface-500',
              )}>
                {stats.overdue}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Task list ───────────────────────────────────────── */}
      {isLoading ? (
        // Skeleton
        <div className="card p-2 space-y-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <TaskRowSkeleton key={i} />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        // Empty state
        <EmptyState
          icon={CheckSquare}
          title={
            hasFilters
              ? 'No tasks match your filters'
              : 'No tasks assigned to you'
          }
          description={
            hasFilters
              ? 'Try clearing your filters to see all tasks'
              : 'Tasks assigned to you will appear here'
          }
          actionLabel={hasFilters ? 'Clear filters' : undefined}
          onAction={hasFilters ? () => {
            setStatusFilter('')
            setPriorityFilter('')
            setSearch('')
            setOverdueOnly(false)
          } : undefined}
        />
      ) : (
        // Grouped task list
        <div className="space-y-4">
          {groupedTasks.map(([projectId, group]) => (
            <div key={projectId} className="card p-2">
              {/* Project group header */}
              <div className="flex items-center justify-between px-4 py-2
                              border-b border-surface-700/50 mb-1">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-surface-500" />
                  <Link
                    to={`/projects/${projectId}`}
                    className="text-sm font-semibold text-surface-200
                               hover:text-primary-400 transition-colors"
                  >
                    {group.projectName}
                  </Link>
                </div>
                <span className="text-xs text-surface-600">
                  {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Tasks in this project */}
              <div className="space-y-0.5">
                {group.tasks.map((task) => (
                  <MyTaskRow
                    key={task.id}
                    task={task}
                    onEdit={setEditTask}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Footer count */}
          <p className="text-xs text-surface-600 text-center pb-2">
            Showing {filteredTasks.length} of {stats.total} task
            {stats.total !== 1 ? 's' : ''}
            {hasFilters && ' (filtered)'}
          </p>
        </div>
      )}

      {/* ── Edit modal ──────────────────────────────────────── */}
      <EditTaskModal
        task={editTask}
        open={!!editTask}
        onClose={() => setEditTask(null)}
      />
    </div>
  )
}