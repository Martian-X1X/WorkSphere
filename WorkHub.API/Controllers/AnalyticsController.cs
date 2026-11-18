using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkHub.Application.DTOs.Analytics;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.Interfaces;

namespace WorkHub.API.Controllers;

[ApiController]
[Route("api/analytics")]
[Produces("application/json")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    private readonly ICurrentUserService _currentUser;

    public AnalyticsController(
        IAnalyticsService analyticsService,
        ICurrentUserService currentUser)
    {
        _analyticsService = analyticsService;
        _currentUser = currentUser;
    }

    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(ApiResponse<DashboardAnalyticsDto>), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] int trendDays = 30)
    {
        var result = await _analyticsService.GetDashboardAsync(
            _currentUser.OrganizationId,
            _currentUser.UserId,
            trendDays);

        return Ok(ApiResponse<DashboardAnalyticsDto>.Ok(result));
    }
}
