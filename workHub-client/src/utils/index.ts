import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { classifyError } from "@/lib/errors"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—"
  return format(new Date(date), "MMM d, yyyy")
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—"
  return format(new Date(date), "MMM d, yyyy h:mm a")
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return "—"
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isOverdue(dueDate: string | null | undefined, status: string): boolean {
  if (!dueDate) return false
  if (status === "Done" || status === "Cancelled") return false
  return isPast(new Date(dueDate))
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes) return "—"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function getProjectStatusClass(status: string): string {
  const map: Record<string, string> = {
    Active: "badge-active",
    OnHold: "badge-onhold",
    Completed: "badge-completed",
    Archived: "badge-archived",
  }
  return map[status] ?? "badge"
}

export function getTaskStatusClass(status: string): string {
  const map: Record<string, string> = {
    Todo: "badge-todo",
    InProgress: "badge-inprogress",
    InReview: "badge-inreview",
    Done: "badge-done",
    Cancelled: "badge-cancelled",
  }
  return map[status] ?? "badge"
}

export function getPriorityClass(priority: string): string {
  const map: Record<string, string> = {
    Low: "badge-low",
    Medium: "badge-medium",
    High: "badge-high",
    Urgent: "badge-urgent",
  }
  return map[priority] ?? "badge"
}

export function getRoleColor(role: string | undefined): string {
  const map: Record<string, string> = {
    Owner: "text-yellow-400",
    Admin: "text-blue-400",
    Member: "text-surface-400",
  }
  return map[role ?? ""] ?? "text-surface-400"
}

export function getApiError(error: unknown): string {
  return classifyError(error).message
}

export function getApiErrors(error: unknown): string[] {
  const classified = classifyError(error)
  return classified.errors.length > 0
    ? classified.errors
    : [classified.message]
}
