import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

// Layouts
import { AppLayout }       from '@/components/layout/AppLayout'
import { ProtectedRoute }  from '@/components/layout/ProtectedRoute'
import { PermissionRoute } from '@/components/layout/PermissionRoute'

// Auth pages (use AuthLayout internally)
import LoginPage    from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

// App pages (render inside AppLayout)
import DashboardPage  from '@/pages/dashboard/DashboardPage'
import ProjectsPage   from '@/pages/projects/ProjectsPage'
import MyTasksPage    from '@/pages/tasks/MyTasksPage'
import MembersPage    from '@/pages/members/MembersPage'
import ActivityPage   from '@/pages/activity/ActivityPage'
import SettingsPage   from '@/pages/settings/SettingsPage'
import ProjectDetailPage from '@/pages/projects/ProjectDetailPage'
import TaskDetailPage from '@/pages/tasks/TaskDetailPage'

// Error pages
import ForbiddenPage from '@/pages/errors/ForbiddenPage'
import NotFoundPage  from '@/pages/errors/NotFoundPage'

// ── Listens for global 403 events fired by the axios interceptor ───
function ForbiddenListener() {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      console.warn('403 Forbidden:', detail.url)
      toast.error('You do not have permission to perform this action.', {
        id: 'forbidden',  // deduplicate — only show once
      })
    }

    window.addEventListener('worksphere:forbidden', handler)
    return () => window.removeEventListener('worksphere:forbidden', handler)
  }, [navigate])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ForbiddenListener />
      <Routes>
        {/* ── Public routes (no shell) ────────────────────── */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Protected routes (inside AppLayout shell) ───── */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* ── Open to all authenticated users ──────────────── */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/activity"  element={<ActivityPage />} />
          <Route path="/tasks"     element={<MyTasksPage />} />

          {/* ── Requires projects.view ───────────────────────── */}
          <Route path="/projects" element={
            <PermissionRoute permission="projects.view">
              <ProjectsPage />
            </PermissionRoute>
          } />
          <Route path="/projects/:projectId" element={
            <PermissionRoute permission="projects.view">
              <ProjectDetailPage />
            </PermissionRoute>
          } />
          <Route path="/tasks/:taskId" element={
            <PermissionRoute permission="tasks.view">
              <TaskDetailPage />
            </PermissionRoute>
          } />

          {/* ── Requires members.view ────────────────────────── */}
          <Route path="/members" element={
            <PermissionRoute permission="members.view">
              <MembersPage />
            </PermissionRoute>
          } />

          {/* ── Requires organizations.update (Owner only) ───── */}
          <Route path="/settings" element={
            <PermissionRoute permission="organizations.update">
              <SettingsPage />
            </PermissionRoute>
          } />

          {/* ── 403 for authenticated users ──────────────────── */}
          <Route path="/forbidden" element={<ForbiddenPage />} />
        </Route>

        {/* ── Default redirect ─────────────────────────────── */}
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />

        {/* ── 404 ──────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
