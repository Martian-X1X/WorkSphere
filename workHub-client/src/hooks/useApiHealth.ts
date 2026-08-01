import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

type HealthStatus = 'healthy' | 'degraded' | 'offline' | 'unknown'

export function useApiHealth() {
  const query = useQuery({
    queryKey:       ['health'],
    queryFn:        () => axios.get('/health', { timeout: 5000 }),
    refetchInterval: 1000 * 30,      // poll every 30s
    staleTime:       1000 * 25,
    retry:           0,              // don't retry health check
    refetchOnWindowFocus: true,
  })

  let status: HealthStatus = 'unknown'

  if (query.isSuccess)          status = 'healthy'
  else if (query.isError)       status = 'offline'
  else if (query.isLoading)     status = 'unknown'

  return {
    status,
    isHealthy:  status === 'healthy',
    isOffline:  status === 'offline',
    isLoading:  query.isLoading,
    lastChecked: query.dataUpdatedAt
      ? new Date(query.dataUpdatedAt)
      : null,
  }
}
