export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:projectId',
  TASK_DETAIL: '/projects/:projectId/tasks/:taskId',
  TEAM: '/team',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
  ACCEPT_INVITE: '/invites/:token',
} as const
