using Microsoft.EntityFrameworkCore;
using WorkHub.Application.Authorization;
using WorkHub.Infrastructure.Data;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.DTOs.Organization;
using WorkHub.Application.DTOs.Project;
using WorkHub.Application.Interfaces;
using WorkHub.Domain.Entities;

namespace WorkHub.Application.Services;

public class ProjectService : IProjectService
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IPermissionService _permissionService;
    private readonly OrgScopeGuard _orgScopeGuard;
    private readonly ILogger<ProjectService> _logger;
    private readonly IActivityService _activityService;

    public ProjectService(
        AppDbContext context,
        ICurrentUserService currentUser,
        IPermissionService permissionService,
        OrgScopeGuard orgScopeGuard,
        IActivityService activityService,
        ILogger<ProjectService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _permissionService = permissionService;
        _orgScopeGuard = orgScopeGuard;
        _activityService = activityService;
        _logger = logger;
    }

    // ════════════════════════════════════════════════════════════
    // GET PROJECTS (paginated + filtered)
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<PagedResult<ProjectDto>>> GetProjectsAsync(
        ProjectQueryDto query)
    {
        try
        {
            // ── Clamp pagination ───────────────────────────────
            query.Page = Math.Max(1, query.Page);
            query.PageSize = Math.Clamp(query.PageSize, 1, 100);

            // ── Base query — always scoped to current org ──────
            var baseQuery = _context.Projects
                .Include(p => p.CreatedBy)
                .Include(p => p.ProjectLead)
                .Include(p => p.Tasks)
                .Where(p => p.OrganizationId == _currentUser.OrganizationId);

            // ── Filter by status ───────────────────────────────
            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                if (!ProjectStatus.IsValid(query.Status))
                    return ApiResponse<PagedResult<ProjectDto>>.Fail(
                        $"Invalid status '{query.Status}'. " +
                        $"Valid values: {string.Join(", ", ProjectStatus.All)}");

                baseQuery = baseQuery.Where(p => p.Status == query.Status);
            }

            // ── Search by name ─────────────────────────────────
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.Trim().ToLower();
                baseQuery = baseQuery.Where(p =>
                    p.Name.ToLower().Contains(search) ||
                    (p.Description != null &&
                     p.Description.ToLower().Contains(search)));
            }

            // ── Sorting ────────────────────────────────────────
            baseQuery = query.SortBy.ToLower() switch
            {
                "name" => query.SortDirection == "asc"
                    ? baseQuery.OrderBy(p => p.Name)
                    : baseQuery.OrderByDescending(p => p.Name),
                "duedate" => query.SortDirection == "asc"
                    ? baseQuery.OrderBy(p => p.DueDate)
                    : baseQuery.OrderByDescending(p => p.DueDate),
                "status" => query.SortDirection == "asc"
                    ? baseQuery.OrderBy(p => p.Status)
                    : baseQuery.OrderByDescending(p => p.Status),
                _ => query.SortDirection == "asc"
                    ? baseQuery.OrderBy(p => p.CreatedAt)
                    : baseQuery.OrderByDescending(p => p.CreatedAt)
            };

            // ── Paginate ───────────────────────────────────────
            var totalCount = await baseQuery.CountAsync();
            var projects = await baseQuery
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            var result = new PagedResult<ProjectDto>
            {
                Items = projects.Select(MapToDto).ToList(),
                TotalCount = totalCount,
                Page = query.Page,
                PageSize = query.PageSize
            };

            _logger.LogInformation(
                "Projects listed for org {OrgId} — {Count} results",
                _currentUser.OrganizationId, projects.Count);

            return ApiResponse<PagedResult<ProjectDto>>.Ok(result,
                $"{totalCount} project(s) found.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing projects for org {OrgId}",
                _currentUser.OrganizationId);
            return ApiResponse<PagedResult<ProjectDto>>.Fail(
                "An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // GET PROJECT BY ID
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<ProjectDto>> GetProjectByIdAsync(Guid projectId)
    {
        try
        {
            var project = await _context.Projects
                .Include(p => p.CreatedBy)
                .Include(p => p.ProjectLead)
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return ApiResponse<ProjectDto>.Fail("Project not found.");

            // ✅ IDOR protection — is this project in the caller's org?
            var guard = _orgScopeGuard.Check(project.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<ProjectDto>.Fail(guard.Reason!);

            return ApiResponse<ProjectDto>.Ok(
                MapToDto(project),
                "Project retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting project {ProjectId}", projectId);
            return ApiResponse<ProjectDto>.Fail("An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // CREATE PROJECT
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<ProjectDto>> CreateProjectAsync(
        CreateProjectDto dto)
    {
        try
        {
            // ── Validate project lead is in same org ───────────
            if (dto.ProjectLeadUserId.HasValue)
            {
                var leadExists = await _context.Users.AnyAsync(u =>
                    u.Id == dto.ProjectLeadUserId.Value &&
                    u.OrganizationId == _currentUser.OrganizationId &&
                    u.IsActive);

                if (!leadExists)
                    return ApiResponse<ProjectDto>.Fail(
                        "Project lead must be an active member of your organization.");
            }

            var project = new Project
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                Status = ProjectStatus.Active, // Always starts as Active
                OrganizationId = _currentUser.OrganizationId,
                CreatedByUserId = _currentUser.UserId,
                ProjectLeadUserId = dto.ProjectLeadUserId,
                StartDate = dto.StartDate?.ToUniversalTime(),
                DueDate = dto.DueDate?.ToUniversalTime()
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            await _activityService.LogAsync(
            ActivityAction.ProjectCreated,
            ActivityEntityType.Project,
            project.Id,
            entityName: project.Name);

            // ── Reload with navigation props for response ──────
            var created = await _context.Projects
                .Include(p => p.CreatedBy)
                .Include(p => p.ProjectLead)
                .Include(p => p.Tasks)
                .FirstAsync(p => p.Id == project.Id);

            _logger.LogInformation(
                "Project {ProjectId} '{Name}' created by {UserId} in org {OrgId}",
                project.Id, project.Name,
                _currentUser.UserId, _currentUser.OrganizationId);

            return ApiResponse<ProjectDto>.Ok(
                MapToDto(created),
                "Project created successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating project for org {OrgId}",
                _currentUser.OrganizationId);
            return ApiResponse<ProjectDto>.Fail("An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // UPDATE PROJECT
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<ProjectDto>> UpdateProjectAsync(
        Guid projectId, UpdateProjectDto dto)
    {
        try
        {
            var project = await _context.Projects
                .Include(p => p.CreatedBy)
                .Include(p => p.ProjectLead)
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return ApiResponse<ProjectDto>.Fail("Project not found.");

            // ✅ Org scope guard
            var guard = _orgScopeGuard.Check(project.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<ProjectDto>.Fail(guard.Reason!);

            // ✅ Ownership check — creator or Admin/Owner can update
            var ownerGuard = _orgScopeGuard.CheckOwnership(
                project.OrganizationId,
                project.CreatedByUserId);
            if (!ownerGuard.Allowed)
                return ApiResponse<ProjectDto>.Fail(ownerGuard.Reason!);

            // ── Validate project lead ──────────────────────────
            if (dto.ProjectLeadUserId.HasValue)
            {
                var leadExists = await _context.Users.AnyAsync(u =>
                    u.Id == dto.ProjectLeadUserId.Value &&
                    u.OrganizationId == _currentUser.OrganizationId &&
                    u.IsActive);

                if (!leadExists)
                    return ApiResponse<ProjectDto>.Fail(
                        "Project lead must be an active member of your organization.");
            }

            // ── Apply updates ──────────────────────────────────
            project.Name = dto.Name.Trim();
            project.Description = dto.Description?.Trim();
            project.ProjectLeadUserId = dto.ProjectLeadUserId;
            project.StartDate = dto.StartDate?.ToUniversalTime();
            project.DueDate = dto.DueDate?.ToUniversalTime();

            await _context.SaveChangesAsync();

            await _activityService.LogAsync(
                ActivityAction.ProjectUpdated,
                ActivityEntityType.Project,
                project.Id,
                entityName: project.Name);

            // Reload navigation props after save
            await _context.Entry(project)
                .Reference(p => p.ProjectLead)
                .LoadAsync();

            _logger.LogInformation(
                "Project {ProjectId} updated by {UserId}",
                projectId, _currentUser.UserId);

            return ApiResponse<ProjectDto>.Ok(
                MapToDto(project),
                "Project updated successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating project {ProjectId}", projectId);
            return ApiResponse<ProjectDto>.Fail("An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // CHANGE PROJECT STATUS
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<ProjectDto>> ChangeProjectStatusAsync(
        Guid projectId, string newStatus)
    {
        try
        {
            if (!ProjectStatus.IsValid(newStatus))
                return ApiResponse<ProjectDto>.Fail(
                    $"Invalid status '{newStatus}'. " +
                    $"Valid values: {string.Join(", ", ProjectStatus.All)}");

            var project = await _context.Projects
                .Include(p => p.CreatedBy)
                .Include(p => p.ProjectLead)
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return ApiResponse<ProjectDto>.Fail("Project not found.");

            // ✅ Org scope guard
            var guard = _orgScopeGuard.Check(project.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<ProjectDto>.Fail(guard.Reason!);

            // ✅ Archiving requires special permission
            if (newStatus == ProjectStatus.Archived &&
                !_permissionService.CurrentUserHasPermission(
                    Permissions.Projects.Archive))
                return ApiResponse<ProjectDto>.Fail(
                    "You do not have permission to archive projects.");

            var oldStatus = project.Status;
            project.Status = newStatus;
            await _context.SaveChangesAsync();

            await _activityService.LogAsync(
                ActivityAction.ProjectStatusChanged,
                ActivityEntityType.Project,
                project.Id,
                entityName: project.Name,
                metadata: new { from = oldStatus, to = newStatus });

            _logger.LogInformation(
                "Project {ProjectId} status changed {OldStatus} → {NewStatus} by {UserId}",
                projectId, oldStatus, newStatus, _currentUser.UserId);

            return ApiResponse<ProjectDto>.Ok(
                MapToDto(project),
                $"Project status changed to {newStatus}.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing status for project {ProjectId}",
                projectId);
            return ApiResponse<ProjectDto>.Fail("An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // DELETE PROJECT
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<object>> DeleteProjectAsync(Guid projectId)
    {
        try
        {
            var project = await _context.Projects
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return ApiResponse<object>.Fail("Project not found.");

            // ✅ Org scope guard
            var guard = _orgScopeGuard.Check(project.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<object>.Fail(guard.Reason!);

            var taskCount = project.Tasks.Count;

            // ✅ Soft delete — EF Core intercepts in SaveChangesAsync
            // Tasks cascade via DB FK — but soft delete needs manual handling
            foreach (var task in project.Tasks)
            {
                _context.Tasks.Remove(task); // → intercepted → IsDeleted = true
            }

            _context.Projects.Remove(project); // → intercepted → IsDeleted = true
            await _context.SaveChangesAsync();

            await _activityService.LogAsync(
                ActivityAction.ProjectDeleted,
                ActivityEntityType.Project,
                projectId,
                entityName: project.Name);

            _logger.LogInformation(
                "Project {ProjectId} deleted by {UserId} — {TaskCount} tasks removed",
                projectId, _currentUser.UserId, taskCount);

            return ApiResponse<object>.Ok(null!,
                $"Project deleted successfully. {taskCount} associated task(s) also removed.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting project {ProjectId}", projectId);
            return ApiResponse<object>.Fail("An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // PRIVATE MAPPER
    // ════════════════════════════════════════════════════════════
    private static ProjectDto MapToDto(Project project)
    {
        var tasks = project.Tasks?.ToList() ?? new List<WorkTask>();

        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Status = project.Status,
            OrganizationId = project.OrganizationId,
            CreatedByUserId = project.CreatedByUserId,
            CreatedByName = project.CreatedBy?.FullName ?? "Unknown",
            ProjectLeadUserId = project.ProjectLeadUserId,
            ProjectLeadName = project.ProjectLead?.FullName,
            StartDate = project.StartDate,
            DueDate = project.DueDate,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            TaskSummary = new TaskSummaryDto
            {
                Total = tasks.Count,
                Todo = tasks.Count(t => t.Status == WorkTaskStatus.Todo),
                InProgress = tasks.Count(t => t.Status == WorkTaskStatus.InProgress),
                InReview = tasks.Count(t => t.Status == WorkTaskStatus.InReview),
                Done = tasks.Count(t => t.Status == WorkTaskStatus.Done),
                Cancelled = tasks.Count(t => t.Status == WorkTaskStatus.Cancelled)
            }
        };
    }
}