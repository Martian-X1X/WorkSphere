using WorkHub.Application.DTOs.Analytics;

namespace WorkHub.Application.Interfaces;

public interface IAnalyticsService
{
    Task<DashboardAnalyticsDto> GetDashboardAsync(
        Guid organizationId,
        Guid currentUserId,
        int trendDays = 30);
}
