using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkHub.API.Authorization;
using WorkHub.API.DTOs.Common;
using WorkHub.API.DTOs.Organization;
using WorkHub.API.DTOs.Project;
using WorkHub.API.Interfaces;

namespace WorkHub.API.Controllers;

[ApiController]
[Route("api/projects")]
[Produces("application/json")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly ILogger<ProjectsController> _logger;

    public ProjectsController(
        IProjectService projectService,
        ILogger<ProjectsController> logger)
    {
        _projectService = projectService;
        _logger = logger;
    }

    /// <summary>
    /// Get all projects in the current organization.
    /// Supports filtering by status, searching by name, sorting, pagination.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = PolicyNames.CanViewProjects)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ProjectDto>>), 200)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> GetProjects([FromQuery] ProjectQueryDto query)
    {
        var result = await _projectService.GetProjectsAsync(query);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get a single project by ID — includes full task summary.
    /// Cross-org access blocked by OrgScopeGuard.
    /// </summary>
    [HttpGet("{projectId:guid}")]
    [Authorize(Policy = PolicyNames.CanViewProjects)]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 404)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> GetProject(Guid projectId)
    {
        var result = await _projectService.GetProjectByIdAsync(projectId);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Create a new project in the current organization.
    /// Always starts with status 'Active'.
    /// Owner and Admin only.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = PolicyNames.CanCreateProjects)]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 400)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<ProjectDto>.Fail(errors));
        }

        var result = await _projectService.CreateProjectAsync(dto);

        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    /// <summary>
    /// Update project name, description, lead, and dates.
    /// Project creator or Admin/Owner can update.
    /// </summary>
    [HttpPut("{projectId:guid}")]
    [Authorize(Policy = PolicyNames.CanManageProjects)]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 400)]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 404)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> UpdateProject(
        Guid projectId,
        [FromBody] UpdateProjectDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<ProjectDto>.Fail(errors));
        }

        var result = await _projectService.UpdateProjectAsync(projectId, dto);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Change project status — Active, OnHold, Completed, Archived.
    /// Archiving requires CanArchiveProjects permission (Owner only).
    /// </summary>
    [HttpPatch("{projectId:guid}/status")]
    [Authorize(Policy = PolicyNames.CanManageProjects)]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 400)]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 404)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> ChangeStatus(
        Guid projectId,
        [FromBody] ChangeProjectStatusDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<ProjectDto>.Fail(errors));
        }

        var result = await _projectService
            .ChangeProjectStatusAsync(projectId, dto.Status);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Soft delete a project and all its tasks.
    /// Owner and Admin only.
    /// </summary>
    [HttpDelete("{projectId:guid}")]
    [Authorize(Policy = PolicyNames.CanDeleteProjects)]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> DeleteProject(Guid projectId)
    {
        var result = await _projectService.DeleteProjectAsync(projectId);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }
}