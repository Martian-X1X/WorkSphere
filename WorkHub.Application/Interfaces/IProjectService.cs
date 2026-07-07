using WorkHub.Application.DTOs.Common;
using WorkHub.Application.DTOs.Organization;
using WorkHub.Application.DTOs.Project;

namespace WorkHub.Application.Interfaces;

public interface IProjectService
{
    /// <summary>
    /// Get paginated list of projects in the current org.
    /// Supports filtering by status and searching by name.
    /// </summary>
    Task<ApiResponse<PagedResult<ProjectDto>>> GetProjectsAsync(
        ProjectQueryDto query);

    /// <summary>
    /// Get a single project by ID — with full task summary.
    /// OrgScopeGuard enforced — cross-org access blocked.
    /// </summary>
    Task<ApiResponse<ProjectDto>> GetProjectByIdAsync(Guid projectId);

    /// <summary>
    /// Create a new project in the current org.
    /// CreatedByUserId set automatically from JWT.
    /// </summary>
    Task<ApiResponse<ProjectDto>> CreateProjectAsync(CreateProjectDto dto);

    /// <summary>
    /// Update project details.
    /// Only Owner/Admin or project creator can update.
    /// </summary>
    Task<ApiResponse<ProjectDto>> UpdateProjectAsync(
        Guid projectId, UpdateProjectDto dto);

    /// <summary>
    /// Change project status — Active, OnHold, Completed, Archived.
    /// Archived projects require CanArchiveProjects permission.
    /// </summary>
    Task<ApiResponse<ProjectDto>> ChangeProjectStatusAsync(
        Guid projectId, string newStatus);

    /// <summary>
    /// Soft delete a project.
    /// Cascades to all tasks — they are also soft-deleted.
    /// Owner/Admin only.
    /// </summary>
    Task<ApiResponse<object>> DeleteProjectAsync(Guid projectId);
}