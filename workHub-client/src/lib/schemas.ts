import { z } from 'zod'

// ── Reusable field validators ──────────────────────────────────────
const emailField = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .transform((v) => v.trim().toLowerCase())

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .refine((v) => /[A-Z]/.test(v),        'Must contain at least one uppercase letter')
  .refine((v) => /[a-z]/.test(v),        'Must contain at least one lowercase letter')
  .refine((v) => /[0-9]/.test(v),        'Must contain at least one number')
  .refine((v) => /[^A-Za-z0-9]/.test(v), 'Must contain at least one special character')
  .refine((v) => !/\s/.test(v),          'Password cannot contain spaces')

const nameField = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .max(100, `${label} cannot exceed 100 characters`)
    .trim()

// ── Auth schemas ───────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    emailField,
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    firstName:        nameField('First name'),
    lastName:         nameField('Last name'),
    email:            emailField,
    password:         passwordField,
    confirmPassword:  z.string().min(1, 'Please confirm your password'),
    organizationName: z
      .string()
      .min(1, 'Organization name is required')
      .max(100, 'Organization name cannot exceed 100 characters')
      .trim(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>

// ── Project schema ─────────────────────────────────────────────────
export const projectSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Project name is required')
      .max(200, 'Name cannot exceed 200 characters')
      .trim(),

    description: z
      .string()
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional()
      .transform((v) => v?.trim() || undefined),

    startDate: z.string().optional(),
    dueDate:   z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.startDate && d.dueDate) {
        return new Date(d.dueDate) > new Date(d.startDate)
      }
      return true
    },
    {
      message: 'Due date must be after start date',
      path:    ['dueDate'],
    }
  )

export type ProjectFormData = z.infer<typeof projectSchema>

// ── Task schema ────────────────────────────────────────────────────
export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(500, 'Title cannot exceed 500 characters')
    .trim(),

  description: z
    .string()
    .max(4000, 'Description cannot exceed 4000 characters')
    .optional(),

  priority: z.enum(['Low', 'Medium', 'High', 'Urgent'], 'Priority is required'),

  assignedToUserId: z.string().optional(),
  dueDate:          z.string().optional(),

  estimatedHours: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 999),
      'Must be a number between 0 and 999'
    ),
})

export type TaskFormData = z.infer<typeof taskSchema>

// ── Invite schema ──────────────────────────────────────────────────
export const inviteSchema = z.object({
  email: emailField,
  role:  z.enum(['Owner', 'Admin', 'Member'], 'Please select a role'),
})

export type InviteFormData = z.infer<typeof inviteSchema>

// ── Change role schema ─────────────────────────────────────────────
export const changeRoleSchema = z.object({
  role: z.enum(['Owner', 'Admin', 'Member'], 'Please select a role'),
})

export type ChangeRoleFormData = z.infer<typeof changeRoleSchema>

// ── Comment schema ─────────────────────────────────────────────────
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(4000, 'Comment cannot exceed 4000 characters')
    .refine((v) => v.trim().length > 0, 'Comment cannot be only whitespace'),
})

export type CommentFormData = z.infer<typeof commentSchema>

// ── Org update schema ──────────────────────────────────────────────
export const orgUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),

  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .transform((v) => v?.trim() || undefined),

  logoUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
})

export type OrgUpdateFormData = z.infer<typeof orgUpdateSchema>
