using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkHub.API.Authorization;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.Interfaces;

namespace WorkHub.API.Controllers;

[ApiController]
[Route("api")]
[Produces("application/json")]
[Authorize]
public class ActivityController : ControllerBase
{
    private readonly IActivityService _activityService;
    private readonly ILogger<ActivityController> _logger;

    public ActivityController(
        IActivityService activityService,
        ILogger<ActivityController> logger)
    {
        _activityService = activityService;
        _logger = logger;
    }

    /// <summary>
    /// Get all activity in the current organization — newest first.
    /// Useful for an org-wide activity feed / dashboard widget.
    /// </summary>
    [HttpGet("activity")]
    [Authorize(Policy = PolicyNames.CanViewProjects)]
    [ProducesResponseType(200)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> GetOrgActivity(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var logs = await _activityService.GetOrgActivityAsync(page, pageSize);
        return Ok(ApiResponse<List<ActivityLogDto>>.Ok(logs,
            $"{logs.Count} activity event(s) found."));
    }

    /// <summary>
    /// Get all activity for a specific project — includes task + comment events.
    /// </summary>
    [HttpGet("projects/{projectId:guid}/activity")]
    [Authorize(Policy = PolicyNames.CanViewProjects)]
    [ProducesResponseType(200)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> GetProjectActivity(
        Guid projectId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var logs = await _activityService
            .GetProjectActivityAsync(projectId, page, pageSize);

        return Ok(ApiResponse<List<ActivityLogDto>>.Ok(logs,
            $"{logs.Count} activity event(s) found."));
    }

    /// <summary>
    /// Get all activity for a specific task — includes status changes, assignments, comments.
    /// </summary>
    [HttpGet("tasks/{taskId:guid}/activity")]
    [Authorize(Policy = PolicyNames.CanViewTasks)]
    [ProducesResponseType(200)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> GetTaskActivity(
        Guid taskId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var logs = await _activityService
            .GetTaskActivityAsync(taskId, page, pageSize);

        return Ok(ApiResponse<List<ActivityLogDto>>.Ok(logs,
            $"{logs.Count} activity event(s) found."));
    }
}