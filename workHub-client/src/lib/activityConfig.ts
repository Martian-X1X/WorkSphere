// ── Activity category ───────────────────────────────────────────────
export type ActivityCategory = 'all' | 'project' | 'task' | 'comment' | 'member'

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