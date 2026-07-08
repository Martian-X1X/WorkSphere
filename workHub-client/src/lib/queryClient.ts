import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ Data stays fresh for 1 minute — reduces unnecessary API calls
      staleTime: 1000 * 60,

      // ✅ Keep cache for 5 minutes after component unmounts
      gcTime: 1000 * 60 * 5,

      // ✅ Retry failed requests once
      retry: 1,

      // ✅ Don't refetch when user switches browser tabs
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})