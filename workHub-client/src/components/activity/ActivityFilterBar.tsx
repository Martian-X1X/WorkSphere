import { cn } from '@/utils'
import type { Member, Project } from '@/types'

// ── Category tabs ──────────────────────────────────────────────────
export type ActivityCategory = 'all' | 'project' | 'task' | 'comment' | 'member'

const CATEGORIES: { label: string; value: ActivityCategory; emoji: string }[] = [
  { label: 'All',      value: 'all',     emoji: '🌐' },
  { label: 'Projects', value: 'project', emoji: '📁' },
  { label: 'Tasks',    value: 'task',    emoji: '✅' },
  { label: 'Comments', value: 'comment', emoji: '💬' },
  { label: 'Members',  value: 'member',  emoji: '👥' },
]

// ── Entity type → category map ─────────────────────────────────────
export const ACTION_CATEGORY_MAP: Record<string, ActivityCategory> = {
  ProjectCreated: 'project', ProjectUpdated: 'project',
  ProjectDeleted: 'project', ProjectArchived: 'project',
  ProjectStatusChanged: 'project',
  TaskCreated: 'task', TaskUpdated: 'task', TaskDeleted: 'task',
  TaskStatusChanged: 'task', TaskPriorityChanged: 'task',
  TaskAssigned: 'task', TaskUnassigned: 'task', TaskCompleted: 'task',
  CommentAdded: 'comment', CommentUpdated: 'comment', CommentDeleted: 'comment',
  MemberInvited: 'member', MemberJoined: 'member',
  MemberDeactivated: 'member', MemberRoleChanged: 'member',
}

interface ActivityFilterBarProps {
  category:          ActivityCategory
  onCategoryChange:  (c: ActivityCategory) => void
  projectFilter:     string
  onProjectChange:   (id: string) => void
  userFilter:        string
  onUserChange:      (id: string) => void
  projects:          Project[]
  members:           Member[]
}

export function ActivityFilterBar({
  category,
  onCategoryChange,
  projectFilter,
  onProjectChange,
  userFilter,
  onUserChange,
  projects,
  members,
}: ActivityFilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm',
              'font-medium whitespace-nowrap transition-colors flex-shrink-0',
              category === cat.value
                ? 'bg-primary-600/20 text-primary-400 border border-primary-700/50'
                : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800',
            )}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Project + User dropdowns */}
      <div className="flex gap-2 flex-wrap">
        {/* Project filter */}
        <select
          value={projectFilter}
          onChange={(e) => onProjectChange(e.target.value)}
          className="input-field w-auto cursor-pointer min-w-[160px]"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* User filter */}
        <select
          value={userFilter}
          onChange={(e) => onUserChange(e.target.value)}
          className="input-field w-auto cursor-pointer min-w-[160px]"
        >
          <option value="">All Members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.fullName}</option>
          ))}
        </select>
      </div>
    </div>
  )
}