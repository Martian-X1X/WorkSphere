import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { queryKeys } from '@/lib/queryKeys'

// ── useAuthContext ─────────────────────────────────────────────────
// Loads full auth context from API (permissions, org status)
// and syncs to Zustand store. Call once on app load.
export function useAuthContext() {
  const { user, setPermissions } = useAuthStore()

  const query = useQuery({
    queryKey: queryKeys.auth.context(),
    queryFn: () => authService.getContext(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,  // permissions change rarely — 5min
  })

  // Sync permissions to Zustand whenever they load/change
  useEffect(() => {
    if (query.data?.data.data.permissions) {
      setPermissions(query.data.data.data.permissions)
    }
  }, [query.data, setPermissions])

  return {
    authContext: query.data?.data.data,
    isLoading: query.isLoading,
  }
}