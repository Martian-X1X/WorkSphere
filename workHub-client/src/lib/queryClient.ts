import { QueryClient } from '@tanstack/react-query'
import { classifyError } from './errors'
import { showErrorToast } from './toastManager'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime:    1000 * 60 * 5,

      // Smart retry — only retry GETs, not on 4xx
      retry: (failureCount, error) => {
        const classified = classifyError(error)
        if (!classified.canRetry)              return false
        if (classified.type === 'auth')        return false
        if (classified.type === 'forbidden')   return false
        if (classified.type === 'not_found')   return false
        if (classified.type === 'validation')  return false
        return failureCount < 2   // retry up to 2 times
      },

      // Exponential backoff: 1s, 2s, 4s
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),

      refetchOnWindowFocus:  false,
      refetchOnReconnect:    true,
      refetchOnMount:        true,
    },
    mutations: {
      retry: 0,  // never retry mutations

      // Global mutation error handler
      onError: (error) => {
        const classified = classifyError(error)
        // Don't show toast for auth/forbidden — interceptor handles those
        if (classified.type === 'auth')      return
        if (classified.type === 'forbidden') return
        // Validation errors shown by form components — skip here
        if (classified.type === 'validation') return
        showErrorToast(classified)
      },
    },
  },
})
