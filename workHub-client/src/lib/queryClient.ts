import { QueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

// ── Global error handler ───────────────────────────────────────────
function onQueryError(error: unknown) {
  const axiosError = error as {
    response?: { status?: number; data?: { message?: string } }
  }
  const status  = axiosError.response?.status
  const message = axiosError.response?.data?.message

  // Don't toast on 401 — the axios interceptor handles redirect to login
  if (status === 401) return

  // 403 — permission denied
  if (status === 403) {
    toast.error('You do not have permission to do that.')
    return
  }

  // 404 — silently ignore (component handles empty state)
  if (status === 404) return

  // Everything else — show the API message or a generic one
  toast.error(message ?? 'Something went wrong. Please try again.')
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ── Staletime per query type (overridable per useQuery) ────────
      staleTime: 1000 * 60,           // 1 minute default
      gcTime:    1000 * 60 * 5,       // 5 minutes garbage collection
      retry: (failureCount, error) => {
        const axiosError = error as { response?: { status?: number } }
        const status = axiosError.response?.status
        // Don't retry on auth errors or not found
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2       // retry up to 2 times otherwise
      },
      refetchOnWindowFocus:     false, // don't refetch when tab regains focus
      refetchOnReconnect:       true,  // do refetch when internet reconnects
      refetchOnMount:           true,  // always fetch fresh on component mount
    },
    mutations: {
      retry: 0,                        // never retry mutations
      onError: onQueryError,           // global mutation error handler
    },
  },
})