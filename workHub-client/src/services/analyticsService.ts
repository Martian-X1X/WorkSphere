import api from '@/lib/api'
import type { DashboardAnalytics } from '@/types/analytics'

export const analyticsService = {
  getDashboard: (trendDays = 30): Promise<DashboardAnalytics> =>
    api
      .get<{ data: DashboardAnalytics }>('/analytics/dashboard', {
        params: { trendDays },
      })
      .then((r) => r.data.data),
}
