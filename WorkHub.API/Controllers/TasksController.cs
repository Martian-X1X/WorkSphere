using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkHub.API.Authorization;
using WorkHub.API.DTOs.Common;
using WorkHub.API.DTOs.Organization;
using WorkHub.API.DTOs.Task;
using WorkHub.API.Interfaces;

namespace WorkHub.API.Controllers;

[ApiController]
[Produces("application/json")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly ILogger<TasksController> _logger;

    public TasksController(
        ITaskService taskService,
        ILogger<TasksController> logger)
    {
        _taskService = taskService;
        _logger = logger;
    }

    /// <summary>
    /// Get all tasks in a project.
    /// Supports filtering by status, priority, assignee, search.
    /// All roles can view tasks.
    /// </summary>
    [HttpGet("api/projects/{projectId:guid}/tasks")]
    [Authorize(Policy = PolicyNames.CanViewTasks)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TaskDto>>), 200)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> GetTasks(
        Guid projectId,
        [FromQuery] TaskQueryDto query)
    {
        var result = await _taskService.GetTasksAsync(projectId, query);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get a single task by ID.
    /// Cross-org access blocked by OrgScopeGuard.
    /// </summary>
    [HttpGet("api/tasks/{taskId:guid}")]
    [Authorize(Policy = PolicyNames.CanViewTasks)]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 404)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> GetTask(Guid taskId)
    {
        var result = await _taskService.GetTaskByIdAsync(taskId);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Create a task inside a project.
    /// Owner and Admin only.
    /// </summary>
    [HttpPost("api/projects/{projectId:guid}/tasks")]
    [Authorize(Policy = PolicyNames.CanCreateTasks)]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 400)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> CreateTask(
        Guid projectId,
        [FromBody] CreateTaskDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<TaskDto>.Fail(errors));
        }

        var result = await _taskService.CreateTaskAsync(projectId, dto);

        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    /// <summary>
    /// Update task fields.
    /// Admin/Owner: any task.
    /// Member: only tasks assigned to them.
    /// </summary>
    [HttpPut("api/tasks/{taskId:guid}")]
    [Authorize(Policy = PolicyNames.CanUpdateOwnTasks)]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 400)]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 404)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> UpdateTask(
        Guid taskId,
        [FromBody] UpdateTaskDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<TaskDto>.Fail(errors));
        }

        var result = await _taskService.UpdateTaskAsync(taskId, dto);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Change task status.
    /// Admin/Owner: any task.
    /// Member: only tasks assigned to them.
    /// </summary>
    [HttpPatch("api/tasks/{taskId:guid}/status")]
    [Authorize(Policy = PolicyNames.CanUpdateOwnTasks)]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 400)]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 404)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> ChangeStatus(
        Guid taskId,
        [FromBody] ChangeTaskStatusDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<TaskDto>.Fail(errors));
        }

        var result = await _taskService.ChangeTaskStatusAsync(taskId, dto);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Assign or reassign a task's primary assignee.
    /// Owner and Admin only.
    /// Pass null UserId to unassign.
    /// </summary>
    [HttpPatch("api/tasks/{taskId:guid}/assign")]
    [Authorize(Policy = PolicyNames.CanAssignTasks)]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 400)]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 404)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> AssignTask(
        Guid taskId,
        [FromBody] AssignTaskDto dto)
    {
        var result = await _taskService.AssignTaskAsync(taskId, dto);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Soft delete a task and its subtasks.
    /// Owner and Admin only.
    /// </summary>
    [HttpDelete("api/tasks/{taskId:guid}")]
    [Authorize(Policy = PolicyNames.CanManageTasks)]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> DeleteTask(Guid taskId)
    {
        var result = await _taskService.DeleteTaskAsync(taskId);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }
}