import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Activity } from 'lucide-react'
import { Spinner }          from '@/components/ui/Spinner'
import { QueryError }       from '@/components/ui/QueryError'
import { TaskStatusBadge }  from '@/components/ui/TaskStatusBadge'
import { EditTaskModal }    from '@/components/task/EditTaskModal'
import { TaskActions }      from '@/components/task/TaskActions'
import { CommentList }    from '@/components/comment/CommentList'
import { TaskMetaSidebar }  from '@/components/task/TaskMetaSidebar'
import { ActivityFeed }     from '@/components/task/ActivityFeed'
import {
  useTask,
  useTaskActivity,
  useTaskAssignees,
} from '@/hooks/useTasks'
import { useComments } from '@/hooks/useComments'
import { cn } from '@/utils'
import type { Task } from '@/types'

// ── Tab type ───────────────────────────────────────────────────────
type Tab = 'activity' | 'comments'

export default function TaskDetailPage() {
  const { taskId }    = useParams<{ taskId: string }>()
  const [editOpen,  setEditOpen]  = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('activity')

  // ── Data hooks ──────────────────────────────────────────────────
  const {
    data:      task,
    isLoading: taskLoading,
    error:     taskError,
    refetch:   refetchTask,
  } = useTask(taskId)

  const {
    data:      activities,
    isLoading: activitiesLoading,
  } = useTaskActivity(taskId)

  const {
    data:      assignees,
    isLoading: assigneesLoading,
  } = useTaskAssignees(taskId)

  const { data: comments } = useComments(taskId)
  const commentCount = comments?.length ?? 0

  // ── Loading ──────────────────────────────────────────────────────
  if (taskLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" label="Loading task..." />
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────
  if (taskError) {
    return (
      <QueryError
        error={taskError}
        onRetry={refetchTask}
        title="Failed to load task"
      />
    )
  }

  // ── Not found ────────────────────────────────────────────────────
  if (!task) {
    return (
      <div className="text-center py-24">
        <p className="text-surface-500">Task not found.</p>
        <Link
          to="/projects"
          className="text-primary-400 hover:text-primary-300 text-sm
                     mt-2 inline-block"
        >
          ← Back to Projects
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Breadcrumb ──────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-surface-500">
        <Link
          to="/projects"
          className="hover:text-surface-300 transition-colors"
        >
          Projects
        </Link>
        <span>/</span>
        <Link
          to={`/projects/${task.projectId}`}
          className="hover:text-surface-300 transition-colors truncate
                     max-w-[160px]"
        >
          {task.projectName}
        </Link>
        <span>/</span>
        <span className="text-surface-300 truncate max-w-[200px]">
          {task.title}
        </span>
      </nav>

      {/* ── Back link ───────────────────────────────────────── */}
      <Link
        to={`/projects/${task.projectId}`}
        className="inline-flex items-center gap-1.5 text-sm text-surface-500
                   hover:text-surface-300 transition-colors -mt-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {task.projectName}
      </Link>

      {/* ── Main layout: content + sidebar ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Main content ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Task header card */}
          <div className="card space-y-4">

            {/* Quick actions bar */}
            <TaskActions
              task={task}
              onEdit={() => setEditOpen(true)}
            />

            {/* Title */}
            <div>
              <h1 className="text-xl font-bold text-surface-50 leading-snug">
                {task.title}
              </h1>
              {task.description ? (
                <p className="text-sm text-surface-400 mt-2 leading-relaxed
                               whitespace-pre-wrap">
                  {task.description}
                </p>
              ) : (
                <p className="text-sm text-surface-600 italic mt-2">
                  No description provided
                </p>
              )}
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2 pt-1 border-t
                            border-surface-700/50">
              <span className="text-xs text-surface-500">Status:</span>
              <TaskStatusBadge status={task.status} />
              {task.completedAt && (
                <span className="text-xs text-surface-500 ml-auto">
                  Completed {new Date(task.completedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* ── Tabs: Activity | Comments ───────────────── */}
          <div className="card p-0 overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-surface-700/50">
              {([
                { id: 'activity' as Tab, label: 'Activity',
                  icon: Activity, count: activities?.length },
                { id: 'comments' as Tab, label: 'Comments',
                  icon: MessageSquare, count: commentCount },
              ]).map(({ id, label, icon: Icon, count }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3.5 text-sm font-medium',
                    'border-b-2 transition-colors',
                    activeTab === id
                      ? 'border-primary-500 text-primary-400'
                      : 'border-transparent text-surface-500 hover:text-surface-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {count != null && count > 0 && (
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                      activeTab === id
                        ? 'bg-primary-700/50 text-primary-300'
                        : 'bg-surface-700 text-surface-500'
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-5">
              {activeTab === 'activity' && (
                <ActivityFeed
                  activities={activities ?? []}
                  isLoading={activitiesLoading}
                />
              )}

              {activeTab === 'comments' && (
                <CommentList taskId={taskId!} />
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Metadata sidebar ─────────────────────── */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="text-xs font-semibold text-surface-500 uppercase
                           tracking-wider mb-4">
              Details
            </h2>
            <TaskMetaSidebar
              task={task}
              assignees={assignees ?? []}
              isLoadingAssignees={assigneesLoading}
            />
          </div>
        </div>
      </div>

      {/* ── Edit modal ──────────────────────────────────────── */}
      <EditTaskModal
        task={task as Task}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </div>
  )
}