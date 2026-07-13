import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import { AppLayout }       from '@/components/layout/AppLayout'
import { ProtectedRoute }  from '@/components/layout/ProtectedRoute'

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

export default function App() {
  return (
    <BrowserRouter>
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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects"  element={<ProjectsPage />} />
          <Route path="/tasks"     element={<MyTasksPage />} />
          <Route path="/members"   element={<MembersPage />} />
          <Route path="/activity"  element={<ActivityPage />} />
          <Route path="/settings"  element={<SettingsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        </Route>

        {/* ── Default redirect ─────────────────────────────── */}
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}