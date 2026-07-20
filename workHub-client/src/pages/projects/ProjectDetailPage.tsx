import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Search, RefreshCw, CheckSquare,
} from 'lucide-react'
import { Button }           from '@/components/ui/Button'
import { Spinner }          from '@/components/ui/Spinner'
import { StatusBadge }      from '@/components/ui/StatusBadge'
import { ProgressBar }      from '@/components/ui/ProgressBar'
import { EmptyState }       from '@/components/ui/EmptyState'
import { QueryError }       from '@/components/ui/QueryError'
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle'
import { TaskRow }          from '@/components/task/TaskRow'
import { TaskRowSkeleton }  from '@/components/task/TaskRowSkeleton'
import { KanbanBoard }      from '@/components/task/KanbanBoard'
import { CreateTaskModal }  from '@/components/task/CreateTaskModal'
import { EditTaskModal }    from '@/components/task/EditTaskModal'
import { useProject }       from '@/hooks/useProjects'
import { useTasks }         from '@/hooks/useTasks'
import { useAuthStore }     from '@/stores/authStore'
import { cn }               from '@/utils'
import type { Task }        from '@/types'

// ── Filter constants ───────────────────────────────────────────────
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

export default function ProjectDetailPage() {
  const { projectId }     = useParams<{ projectId: string }>()
  const { isAdminOrOwner } = useAuthStore()

  // ── View + filter state ───────────────────────────────────────
  const [view,           setView]           = useState<ViewMode>('list')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [search,         setSearch]         = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editTask,        setEditTask]        = useState<Task | null>(null)

  // ── Data hooks ────────────────────────────────────────────────
  const {
    data:     project,
    isLoading: projectLoading,
    error:    projectError,
    refetch:  refetchProject,
  } = useProject(projectId)

  // Board view: no status filter (shows all columns)
  // List view: respects status filter
  const {
    data:      tasksData,
    isLoading: tasksLoading,
    isFetching: tasksFetching,
    error:     tasksError,
    refetch:   refetchTasks,
  } = useTasks(projectId, {
    status:   view === 'board' ? undefined : (statusFilter || undefined),
    priority: priorityFilter || undefined,
    search:   search         || undefined,
  })

  const tasks      = tasksData?.items      ?? []
  const totalTasks = tasksData?.totalCount ?? 0

  // ── States ────────────────────────────────────────────────────
  if (projectLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" label="Loading project..." />
      </div>
    )
  }

  if (projectError) {
    return (
      <QueryError
        error={projectError}
        onRetry={refetchProject}
        title="Failed to load project"
      />
    )
  }

  if (!project) {
    return (
      <div className="text-center py-24">
        <p className="text-surface-500">Project not found.</p>
        <Link to="/projects"
          className="text-primary-400 hover:text-primary-300 text-sm mt-2
                     inline-block">
          ← Back to Projects
        </Link>
      </div>
    )
  }

  const summary = project.taskSummary

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Back + header ──────────────────────────────────── */}
      <div className="space-y-4">
        <Link to="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-surface-500
                     hover:text-surface-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Projects
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-surface-50 truncate">
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            {project.description && (
              <p className="text-sm text-surface-400 max-w-xl">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View toggle */}
            <ViewToggle view={view} onChange={setView} />

            {isAdminOrOwner() && (
              <Button
                className="flex items-center gap-2"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Task</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Project stats ───────────────────────────────────── */}
      {summary.total > 0 && (
        <div className="card space-y-3 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {[
                { label: 'Total',       value: summary.total,      color: 'text-surface-300' },
                { label: 'Todo',        value: summary.todo,       color: 'text-surface-400' },
                { label: 'In Progress', value: summary.inProgress, color: 'text-blue-400' },
                { label: 'In Review',   value: summary.inReview,   color: 'text-purple-400' },
                { label: 'Done',        value: summary.done,       color: 'text-green-400' },
              ]
                .filter(s => s.value > 0)
                .map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className={cn('text-lg font-bold', stat.color)}>
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-surface-600">{stat.label}</p>
                  </div>
                ))}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-surface-100">
                {summary.completionPercentage}%
              </p>
              <p className="text-xs text-surface-500">Complete</p>
            </div>
          </div>
          <ProgressBar value={summary.completionPercentage} />
        </div>
      )}

      {/* ── Filters — only shown in list view ──────────────── */}
      {view === 'list' && (
        <div className="space-y-3">
          {/* Status tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap',
                  'transition-colors flex-shrink-0',
                  statusFilter === f.value
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-700/50'
                    : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search + priority + refresh */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2
                                 w-4 h-4 text-surface-500" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input-field w-auto pr-8 cursor-pointer"
            >
              {PRIORITY_FILTERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            <button
              onClick={() => refetchTasks()}
              disabled={tasksFetching}
              className="p-2 border border-surface-700 rounded-lg text-surface-500
                         hover:text-surface-300 hover:border-surface-600
                         bg-surface-800/50 transition-colors"
            >
              <RefreshCw className={cn(
                'w-4 h-4', tasksFetching && 'animate-spin'
              )} />
            </button>
          </div>
        </div>
      )}

      {/* ── Board filter bar — only shown in board view ─────── */}
      {view === 'board' && (
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2
                               w-4 h-4 text-surface-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input-field w-auto pr-8 cursor-pointer"
          >
            {PRIORITY_FILTERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <button
            onClick={() => refetchTasks()}
            disabled={tasksFetching}
            className="p-2 border border-surface-700 rounded-lg text-surface-500
                       hover:text-surface-300 hover:border-surface-600
                       bg-surface-800/50 transition-colors"
          >
            <RefreshCw className={cn(
              'w-4 h-4', tasksFetching && 'animate-spin'
            )} />
          </button>

          <p className="text-xs text-surface-600 ml-auto">
            Drag & drop coming Day 48
          </p>
        </div>
      )}

      {/* ── Error state ─────────────────────────────────────── */}
      {tasksError && (
        <QueryError
          error={tasksError}
          onRetry={refetchTasks}
          title="Failed to load tasks"
        />
      )}

      {/* ── BOARD VIEW ──────────────────────────────────────── */}
      {view === 'board' && !tasksError && (
        <KanbanBoard
          tasks={tasks}
          isLoading={tasksLoading}
          projectId={projectId!}
          onEdit={setEditTask}
          onAddTask={() => setCreateModalOpen(true)}
        />
      )}

      {/* ── LIST VIEW ───────────────────────────────────────── */}
      {view === 'list' && !tasksError && (
        <div className="card p-2 space-y-0.5">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[auto,1fr,auto] gap-3
                          px-4 py-2 text-xs text-surface-600 border-b
                          border-surface-700/50 mb-1">
            <span>Status</span>
            <span>Task</span>
            <span>Priority</span>
          </div>

          {tasksLoading ? (
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <TaskRowSkeleton key={i} />
              ))}
            </div>
          ) : tasks.length > 0 ? (
            <div>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  projectId={projectId!}
                  onEdit={setEditTask}
                />
              ))}
              <div className="px-4 py-2 text-xs text-surface-600 border-t
                              border-surface-700/50 mt-1">
                {totalTasks} task{totalTasks !== 1 ? 's' : ''}
                {statusFilter || priorityFilter || search
                  ? ' matching filters' : ' total'}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={CheckSquare}
              title={
                search || statusFilter || priorityFilter
                  ? 'No tasks match your filters'
                  : 'No tasks yet'
              }
              description={
                search || statusFilter || priorityFilter
                  ? 'Try adjusting your search or filters'
                  : 'Add the first task to get this project started'
              }
              actionLabel={
                isAdminOrOwner() && !search && !statusFilter && !priorityFilter
                  ? '+ Add Task' : undefined
              }
              onAction={
                isAdminOrOwner() && !search && !statusFilter && !priorityFilter
                  ? () => setCreateModalOpen(true) : undefined
              }
            />
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────── */}
      <CreateTaskModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={projectId!}
      />
      <EditTaskModal
        task={editTask}
        open={!!editTask}
        onClose={() => setEditTask(null)}
      />
    </div>
  )
}