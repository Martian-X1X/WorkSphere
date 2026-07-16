// ── Query Key Factory ──────────────────────────────────────────────
// Centralized, type-safe query keys for TanStack Query.
// Prevents typos like ['project'] vs ['projects'] causing cache misses.
//
// Pattern: queryKeys.entity.scope(params)
// Result:  ['entity', 'scope', ...params]
//
// Usage:
//   queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(id) })
//   useQuery({ queryKey: queryKeys.projects.list(filters) })

export const queryKeys = {
  // ── Auth ──────────────────────────────────────────────────────────
  auth: {
    context: () => ['auth', 'context'] as const,
  },

  // ── Organization ──────────────────────────────────────────────────
  org: {
    detail:  () => ['org', 'detail'] as const,
    members: () => ['org', 'members'] as const,
    invites: () => ['org', 'invites'] as const,
  },

  // ── Projects ──────────────────────────────────────────────────────
  projects: {
    all:    () => ['projects'] as const,
    lists:  () => ['projects', 'list'] as const,
    list: (filters: {
      status?: string
      search?: string
      sortBy?: string
      sortDirection?: string
    }) => ['projects', 'list', filters] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    activity: (id: string) => ['projects', 'activity', id] as const,
  },

  // ── Tasks ─────────────────────────────────────────────────────────
  tasks: {
    all:        () => ['tasks'] as const,
    byProject:  (projectId: string) => ['tasks', 'project', projectId] as const,
    byProjectFiltered: (projectId: string, filters: {
      status?: string
      priority?: string
      search?: string
    }) => ['tasks', 'project', projectId, filters] as const,
    detail:     (id: string) => ['tasks', 'detail', id] as const,
    myTasks:    (filters?: {
      status?: string
      priority?: string
      overdue?: boolean
    }) => ['tasks', 'mine', filters ?? {}] as const,
    activity:   (taskId: string) => ['tasks', 'activity', taskId] as const,
    assignees:  (taskId: string) => ['tasks', 'assignees', taskId] as const,
  },

  // ── Comments ──────────────────────────────────────────────────────
  comments: {
    byTask: (taskId: string) => ['comments', taskId] as const,
  },
} as const