import React from 'react'
import {
  User, Calendar, Clock, FolderKanban,
  Tag, Users, CheckSquare,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { formatDate, formatDateTime, formatRelative, formatMinutes, isOverdue, cn } from '@/utils'
import type { Task, TaskAssignee } from '@/types'

interface TaskMetaSidebarProps {
  task:       Task
  assignees:  TaskAssignee[]
  isLoadingAssignees: boolean
}

interface MetaRowProps {
  icon:     React.ReactNode
  label:    string
  children: React.ReactNode
}

function MetaRow({ icon, label, children }: MetaRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-xs text-surface-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="pl-5">{children}</div>
    </div>
  )
}

export function TaskMetaSidebar({
  task,
  assignees,
  isLoadingAssignees,
}: TaskMetaSidebarProps) {
  const overdue = isOverdue(task.dueDate, task.status)

  return (
    <div className="space-y-5">

      {/* ── Primary Assignee ──────────────────────────────── */}
      <MetaRow
        icon={<User className="w-3.5 h-3.5" />}
        label="Assignee"
      >
        {task.assignedToName ? (
          <div className="flex items-center gap-2">
            <Avatar name={task.assignedToName} size="sm" />
            <span className="text-sm font-medium text-surface-200">
              {task.assignedToName}
            </span>
          </div>
        ) : (
          <p className="text-sm text-surface-600 italic">Unassigned</p>
        )}
      </MetaRow>

      {/* ── Additional Assignees ──────────────────────────── */}
      {!isLoadingAssignees && assignees.length > 0 && (
        <MetaRow
          icon={<Users className="w-3.5 h-3.5" />}
          label="Also assigned"
        >
          <div className="space-y-2">
            {assignees.map((a) => (
              <div key={a.userId} className="flex items-center gap-2">
                <Avatar name={a.fullName} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-surface-200 truncate">
                    {a.fullName}
                  </p>
                  <p className="text-xs text-surface-500">
                    Added by {a.assignedByName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </MetaRow>
      )}

      <div className="border-t border-surface-700/50" />

      {/* ── Project ───────────────────────────────────────── */}
      <MetaRow
        icon={<FolderKanban className="w-3.5 h-3.5" />}
        label="Project"
      >
        <p className="text-sm font-medium text-surface-200">
          {task.projectName}
        </p>
      </MetaRow>

      {/* ── Priority ──────────────────────────────────────── */}
      <MetaRow
        icon={<Tag className="w-3.5 h-3.5" />}
        label="Priority"
      >
        <PriorityBadge priority={task.priority} />
      </MetaRow>

      {/* ── Due Date ──────────────────────────────────────── */}
      {task.dueDate && (
        <MetaRow
          icon={<Calendar className="w-3.5 h-3.5" />}
          label="Due date"
        >
          <p className={cn(
            'text-sm font-medium',
            overdue ? 'text-red-400' : 'text-surface-200'
          )}>
            {formatDate(task.dueDate)}
            {overdue && (
              <span className="ml-2 text-xs bg-red-900/30 text-red-400
                               border border-red-800/50 px-1.5 py-0.5 rounded-full">
                Overdue
              </span>
            )}
          </p>
        </MetaRow>
      )}

      {/* ── Time tracking ─────────────────────────────────── */}
      {(task.estimatedMinutes || task.actualMinutes) && (
        <MetaRow
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Time"
        >
          <div className="space-y-1">
            {task.estimatedMinutes && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500">Estimate</span>
                <span className="font-medium text-surface-200">
                  {formatMinutes(task.estimatedMinutes)}
                </span>
              </div>
            )}
            {task.actualMinutes && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500">Actual</span>
                <span className="font-medium text-surface-200">
                  {formatMinutes(task.actualMinutes)}
                </span>
              </div>
            )}
            {/* Progress bar for time */}
            {task.estimatedMinutes && task.actualMinutes && (
              <div className="mt-2">
                <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      task.actualMinutes > task.estimatedMinutes
                        ? 'bg-red-500'
                        : 'bg-green-500'
                    )}
                    style={{
                      width: `${Math.min(
                        (task.actualMinutes / task.estimatedMinutes) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-surface-600 mt-1">
                  {Math.round(
                    (task.actualMinutes / task.estimatedMinutes) * 100
                  )}% of estimate used
                </p>
              </div>
            )}
          </div>
        </MetaRow>
      )}

      <div className="border-t border-surface-700/50" />

      {/* ── Created by ────────────────────────────────────── */}
      <MetaRow
        icon={<CheckSquare className="w-3.5 h-3.5" />}
        label="Created by"
      >
        <div className="flex items-center gap-2">
          <Avatar name={task.createdByName} size="sm" />
          <div>
            <p className="text-sm font-medium text-surface-200">
              {task.createdByName}
            </p>
            <p
              className="text-xs text-surface-500"
              title={formatDateTime(task.createdAt)}
            >
              {formatDate(task.createdAt)}
            </p>
          </div>
        </div>
      </MetaRow>

      {/* ── Last updated ──────────────────────────────────── */}
      <MetaRow
        icon={<Clock className="w-3.5 h-3.5" />}
        label="Last updated"
      >
        <p className="text-sm text-surface-400">
          {formatRelative(task.updatedAt)}
        </p>
      </MetaRow>

      {/* ── Completed at ──────────────────────────────────── */}
      {task.completedAt && (
        <MetaRow
          icon={<CheckSquare className="w-3.5 h-3.5" />}
          label="Completed"
        >
          <p className="text-sm text-green-400">
            {formatDate(task.completedAt)}
          </p>
        </MetaRow>
      )}
    </div>
  )
}