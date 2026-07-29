export const Permissions = {
  Org: {
    View:        'organizations.view',
    Update:      'organizations.update',
    Delete:      'organizations.delete',
    BillingView: 'organizations.billing.view',
  },

  Members: {
    View:       'members.view',
    Invite:     'members.invite',
    Remove:     'members.remove',
    ChangeRole: 'members.changerole',
  },

  Projects: {
    View:    'projects.view',
    Create:  'projects.create',
    Update:  'projects.update',
    Delete:  'projects.delete',
    Archive: 'projects.archive',
  },

  Tasks: {
    View:      'tasks.view',
    Create:    'tasks.create',
    Update:    'tasks.update',
    Delete:    'tasks.delete',
    Assign:    'tasks.assign',
    UpdateOwn: 'tasks.update.own',
  },

  Comments: {
    View:      'comments.view',
    Create:    'comments.create',
    Delete:    'comments.delete',
    DeleteOwn: 'comments.delete.own',
  },

  Reports: {
    View:   'reports.view',
    Export: 'reports.export',
  },
} as const

export type Permission =
  | typeof Permissions.Org[keyof typeof Permissions.Org]
  | typeof Permissions.Members[keyof typeof Permissions.Members]
  | typeof Permissions.Projects[keyof typeof Permissions.Projects]
  | typeof Permissions.Tasks[keyof typeof Permissions.Tasks]
  | typeof Permissions.Comments[keyof typeof Permissions.Comments]
  | typeof Permissions.Reports[keyof typeof Permissions.Reports]

export const RolePermissions: Record<string, string[]> = {
  Owner: [
    'organizations.view', 'organizations.update',
    'organizations.delete', 'organizations.billing.view',
    'members.view', 'members.invite', 'members.remove', 'members.changerole',
    'projects.view', 'projects.create', 'projects.update',
    'projects.delete', 'projects.archive',
    'tasks.view', 'tasks.create', 'tasks.update', 'tasks.delete',
    'tasks.assign', 'tasks.update.own',
    'comments.view', 'comments.create', 'comments.delete', 'comments.delete.own',
    'reports.view', 'reports.export',
  ],
  Admin: [
    'organizations.view',
    'members.view', 'members.invite', 'members.remove',
    'projects.view', 'projects.create', 'projects.update', 'projects.delete',
    'tasks.view', 'tasks.create', 'tasks.update', 'tasks.delete',
    'tasks.assign', 'tasks.update.own',
    'comments.view', 'comments.create', 'comments.delete', 'comments.delete.own',
    'reports.view',
  ],
  Member: [
    'organizations.view',
    'members.view',
    'projects.view',
    'tasks.view', 'tasks.update.own',
    'comments.view', 'comments.create', 'comments.delete.own',
  ],
}
