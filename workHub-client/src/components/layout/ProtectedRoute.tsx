import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  // Zustand persist hydrates synchronously for localStorage, but guard
  // against the first render happening before hydration settles.
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist.hasHydrated()
  )

  useEffect(() => {
    const unsubFinish = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })

    return unsubFinish
  }, [])

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div
          className="w-6 h-6 border-2 border-primary-500 border-t-transparent
                     rounded-full animate-spin"
        />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  return <>{children}</>
}
