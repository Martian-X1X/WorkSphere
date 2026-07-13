import { Link } from 'react-router-dom'
import {
  Calendar,
  CheckSquare,
  User,
  ArrowRight,
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDate, cn } from '@/utils'
import type { Project } from '@/types'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { taskSummary } = project
  const isOverdue =
    project.dueDate &&
    new Date(project.dueDate) < new Date() &&
    project.status === 'Active'

  return (
    <Link
      to={`/projects/${project.id}`}
      className="card-hover flex flex-col gap-4 group"
    >
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-surface-100 truncate
                         group-hover:text-primary-400 transition-colors">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* ── Progress ──────────────────────────────────────── */}
      {taskSummary.total > 0 ? (
        <div className="space-y-1.5">
          <ProgressBar value={taskSummary.completionPercentage} />
          <div className="flex items-center justify-between text-xs text-surface-500">
            <span>
              {taskSummary.done}/{taskSummary.total} tasks
            </span>
            <span>{taskSummary.completionPercentage}%</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-surface-600 italic">No tasks yet</p>
      )}

      {/* ── Task summary pills ────────────────────────────── */}
      {taskSummary.total > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {taskSummary.todo > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-700
                             text-surface-400">
              {taskSummary.todo} todo
            </span>
          )}
          {taskSummary.inProgress > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40
                             text-blue-400">
              {taskSummary.inProgress} in progress
            </span>
          )}
          {taskSummary.done > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/40
                             text-green-400">
              {taskSummary.done} done
            </span>
          )}
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1 border-t
                      border-surface-700/50 mt-auto">
        <div className="flex items-center gap-3 text-xs text-surface-500">
          {/* Project lead */}
          {project.projectLeadName && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[80px]">
                {project.projectLeadName}
              </span>
            </div>
          )}

          {/* Due date */}
          {project.dueDate && (
            <div className={cn(
              'flex items-center gap-1',
              isOverdue ? 'text-red-400' : ''
            )}>
              <Calendar className="w-3 h-3" />
              <span>{formatDate(project.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Task count */}
        <div className="flex items-center gap-1 text-xs text-surface-600
                        group-hover:text-primary-400 transition-colors">
          <CheckSquare className="w-3 h-3" />
          <span>{taskSummary.total}</span>
          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100
                                 transition-opacity -ml-1" />
        </div>
      </div>
    </Link>
  )
}