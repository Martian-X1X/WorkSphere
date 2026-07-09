import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ROUTES } from './routes'
import { ProtectedRoute, GuestRoute } from './guards'
import PublicLayout from '@/shared/components/layout/PublicLayout'
import DashboardLayout from '@/shared/components/layout/DashboardLayout'
import SuspenseFallback from '@/shared/components/feedback/SuspenseFallback'
import NotFoundPage from '@/shared/components/feedback/NotFoundPage'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const ProjectListPage = lazy(() => import('@/features/projects/pages/ProjectListPage'))

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<SuspenseFallback />}>{children}</Suspense>
}

export default function Router() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route element={<GuestRoute />}>
          <Route path={ROUTES.LOGIN} element={<Lazy><LoginPage /></Lazy>} />
          <Route path={ROUTES.REGISTER} element={<Lazy><RegisterPage /></Lazy>} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<Lazy><DashboardPage /></Lazy>} />
          <Route path={ROUTES.PROJECTS} element={<Lazy><ProjectListPage /></Lazy>} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
