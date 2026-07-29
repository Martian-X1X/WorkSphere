import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { queryKeys } from '@/lib/queryKeys'

export function useAuthContext() {
  const { user, setPermissions } = useAuthStore()

  const query = useQuery({
    queryKey: queryKeys.auth.context(),
    queryFn: () => authService.getContext(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })

  useEffect(() => {
    const perms = query.data?.data.data?.permissions
    if (perms && perms.length > 0) {
      setPermissions(perms)
    }
  }, [query.data, setPermissions])

  return {
    authContext: query.data?.data.data,
    isLoading:   query.isLoading,
    permissions: query.data?.data.data?.permissions ?? [],
  }
}