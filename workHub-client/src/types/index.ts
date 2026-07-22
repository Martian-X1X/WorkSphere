// ──────────────────────────────────────────────────────────────────
// API Response wrapper — matches ApiResponse<T> from backend
// ──────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors: string[]
  timestamp: string
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// ──────────────────────────────────────────────────────────────────
// Auth types
// ──────────────────────────────────────────────────────────────────
export interface User {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  role: 'Owner' | 'Admin' | 'Member'
  organizationId: string
  organizationName: string
  isEmailVerified: boolean
  profilePictureUrl: string | null
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  organizationName: string
}

// ──────────────────────────────────────────────────────────────────
// Organization types
// ──────────────────────────────────────────────────────────────────
export interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  plan: string
  isActive: boolean
  memberCount: number
  createdAt: string
  updatedAt: string
}

export interface Member {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  role: 'Owner' | 'Admin' | 'Member'
  isActive: boolean
  isEmailVerified: boolean
  profilePictureUrl: string | null
  lastLoginAt: string | null
  joinedAt: string
}

// ──────────────────────────────────────────────────────────────────
// Project types
// ──────────────────────────────────────────────────────────────────
export type ProjectStatus = 'Active' | 'OnHold' | 'Completed' | 'Archived'

export interface TaskSummary {
  total: number
  todo: number
  inProgress: number
  inReview: number
  done: number
  cancelled: number
  completionPercentage: number
}

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  organizationId: string
  createdByUserId: string
  createdByName: string
  projectLeadUserId: string | null
  projectLeadName: string | null
  startDate: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
  taskSummary: TaskSummary
}

export interface CreateProjectRequest {
  name: string
  description?: string
  projectLeadUserId?: string
  startDate?: string
  dueDate?: string
}

export interface UpdateProjectRequest {
  name: string
  description?: string
  projectLeadUserId?: string
  startDate?: string
  dueDate?: string
}

// ──────────────────────────────────────────────────────────────────
// Task types
// ──────────────────────────────────────────────────────────────────
export type TaskStatus   = 'Todo' | 'InProgress' | 'InReview' | 'Done' | 'Cancelled'
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent'

export interface TaskAssignee {
  userId: string
  fullName: string
  email: string
  role: string
  assignedAt: string
  assignedByName: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  orderIndex: number
  startDate: string | null
  dueDate: string | null
  completedAt: string | null
  estimatedMinutes: number | null
  actualMinutes: number | null
  estimatedHours: string | null
  projectId: string
  projectName: string
  organizationId: string
  createdByUserId: string
  createdByName: string
  assignedToUserId: string | null
  assignedToName: string | null
  parentTaskId: string | null
  subTaskCount: number
  additionalAssignees: TaskAssignee[]
  createdAt: string
  updatedAt: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  priority?: TaskPriority
  startDate?: string
  dueDate?: string
  estimatedMinutes?: number
  assignedToUserId?: string
  orderIndex?: number
}

// ──────────────────────────────────────────────────────────────────
// Comment types
// ──────────────────────────────────────────────────────────────────
export interface Comment {
  id: string
  content: string
  isEdited: boolean
  editedAt: string | null
  createdByUserId: string
  createdByName: string
  isOwnComment: boolean
  taskId: string
  createdAt: string
  updatedAt: string
}

// ──────────────────────────────────────────────────────────────────
// Activity types
// ──────────────────────────────────────────────────────────────────
export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  entityType: string
  entityId: string
  entityName: string
  projectId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

// ──────────────────────────────────────────────────────────────────
// Invite types
// ──────────────────────────────────────────────────────────────────
export interface Invite {
  id: string
  inviteeEmail: string
  role: 'Owner' | 'Admin' | 'Member'
  status: 'Pending' | 'Accepted' | 'Expired' | 'Cancelled'
  inviteLink: string
  expiresAt: string
  createdAt: string
  invitedByName: string
}

// ──────────────────────────────────────────────────────────────────
// Auth context (from GET /api/auth/context)
// ──────────────────────────────────────────────────────────────────
export interface AuthContext {
  userId: string
  email: string
  fullName: string
  role: 'Owner' | 'Admin' | 'Member'
  organizationId: string
  organizationName: string
  isEmailVerified: boolean
  isOwner: boolean
  isAdminOrOwner: boolean
  orgIsActive: boolean
  orgPlan: string
  permissions: string[]
}

// ── Organization types (extend existing) ──────────────────────────
export interface UpdateOrganizationRequest {
  name: string
  description?: string
  logoUrl?: string
}

export interface ChangeMemberRoleRequest {
  role: 'Owner' | 'Admin' | 'Member'
}

// ── Invite types ───────────────────────────────────────────────────
export interface CreateInviteRequest {
  email: string
  role: 'Owner' | 'Admin' | 'Member'
}

export interface InvitePreview {
  organizationName: string
  organizationSlug: string
  invitedByName: string
  role: 'Owner' | 'Admin' | 'Member'
  expiresAt: string
  isExpired: boolean
  isAlreadyAccepted: boolean
}