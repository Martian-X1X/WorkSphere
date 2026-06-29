using Microsoft.EntityFrameworkCore;
using WorkHub.API.Authorization;
using WorkHub.API.Data;
using WorkHub.API.DTOs.Common;
using WorkHub.API.DTOs.Organization;
using WorkHub.API.DTOs.Task;
using WorkHub.API.Interfaces;
using WorkHub.API.Models;

namespace WorkHub.API.Services;

public class TaskService : ITaskService
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IPermissionService _permissionService;
    private readonly OrgScopeGuard _orgScopeGuard;
    private readonly ILogger<TaskService> _logger;

    public TaskService(
        AppDbContext context,
        ICurrentUserService currentUser,
        IPermissionService permissionService,
        OrgScopeGuard orgScopeGuard,
        ILogger<TaskService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _permissionService = permissionService;
        _orgScopeGuard = orgScopeGuard;
        _logger = logger;
    }

    // ════════════════════════════════════════════════════════════
    // GET TASKS (paginated + filtered)
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<PagedResult<TaskDto>>> GetTasksAsync(
        Guid projectId, TaskQueryDto query)
    {
        try
        {
            // ── Verify project exists + belongs to current org ─
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return ApiResponse<PagedResult<TaskDto>>.Fail(
                    "Project not found.");

            var projectGuard = _orgScopeGuard.Check(project.OrganizationId);
            if (!projectGuard.Allowed)
                return ApiResponse<PagedResult<TaskDto>>.Fail(
                    projectGuard.Reason!);

            query.Page = Math.Max(1, query.Page);
            query.PageSize = Math.Clamp(query.PageSize, 1, 100);

            // ── Base query scoped to project ───────────────────
            var baseQuery = _context.Tasks
                .Include(t => t.CreatedBy)
                .Include(t => t.AssignedTo)
                .Include(t => t.Project)
                .Include(t => t.TaskAssignees)
                    .ThenInclude(ta => ta.User)
                .Include(t => t.SubTasks)
                .Where(t => t.ProjectId == projectId);

            // ── Filters ────────────────────────────────────────
            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                if (!WorkTaskStatus.IsValid(query.Status))
                    return ApiResponse<PagedResult<TaskDto>>.Fail(
                        $"Invalid status '{query.Status}'. " +
                        $"Valid: {string.Join(", ", WorkTaskStatus.All)}");
                baseQuery = baseQuery.Where(t => t.Status == query.Status);
            }

            if (!string.IsNullOrWhiteSpace(query.Priority))
            {
                if (!WorkTaskPriority.IsValid(query.Priority))
                    return ApiResponse<PagedResult<TaskDto>>.Fail(
                        $"Invalid priority '{query.Priority}'. " +
                        $"Valid: {string.Join(", ", WorkTaskPriority.All)}");
                baseQuery = baseQuery.Where(t => t.Priority == query.Priority);
            }

            if (query.AssignedToUserId.HasValue)
                baseQuery = baseQuery.Where(t =>
                    t.AssignedToUserId == query.AssignedToUserId.Value);

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.Trim().ToLower();
                baseQuery = baseQuery.Where(t =>
                    t.Title.ToLower().Contains(search) ||
                    (t.Description != null &&
                     t.Description.ToLower().Contains(search)));
            }

            // ── Sorting ────────────────────────────────────────
            baseQuery = query.SortBy.ToLower() switch
            {
                "title" => query.SortDirection == "asc"
                    ? baseQuery.OrderBy(t => t.Title)
                    : baseQuery.OrderByDescending(t => t.Title),
                "priority" => query.SortDirection == "asc"
                    ? baseQuery.OrderBy(t => t.Priority)
                    : baseQuery.OrderByDescending(t => t.Priority),
                "status" => query.SortDirection == "asc"
                    ? baseQuery.OrderBy(t => t.Status)
                    : baseQuery.OrderByDescending(t => t.Status),
                "duedate" => query.SortDirection == "asc"
                    ? baseQuery.OrderBy(t => t.DueDate)
                    : baseQuery.OrderByDescending(t => t.DueDate),
                _ => query.SortDirection == "asc"
                    ? baseQuery.OrderBy(t => t.OrderIndex)
                    : baseQuery.OrderByDescending(t => t.OrderIndex)
            };

            var totalCount = await baseQuery.CountAsync();
            var tasks = await baseQuery
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            var result = new PagedResult<TaskDto>
            {
                Items = tasks.Select(MapToDto).ToList(),
                TotalCount = totalCount,
                Page = query.Page,
                PageSize = query.PageSize
            };

            return ApiResponse<PagedResult<TaskDto>>.Ok(result,
                $"{totalCount} task(s) found.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing tasks for project {ProjectId}",
                projectId);
            return ApiResponse<PagedResult<TaskDto>>.Fail(
                "An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // GET TASK BY ID
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<TaskDto>> GetTaskByIdAsync(Guid taskId)
    {
        try
        {
            var task = await _context.Tasks
                .Include(t => t.CreatedBy)
                .Include(t => t.AssignedTo)
                .Include(t => t.Project)
                .Include(t => t.TaskAssignees)
                    .ThenInclude(ta => ta.User)
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                return ApiResponse<TaskDto>.Fail("Task not found.");

            // ✅ IDOR — task must belong to current user's org
            var guard = _orgScopeGuard.Check(task.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<TaskDto>.Fail(guard.Reason!);

            return ApiResponse<TaskDto>.Ok(
                MapToDto(task), "Task retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting task {TaskId}", taskId);
            return ApiResponse<TaskDto>.Fail("An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // CREATE TASK
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<TaskDto>> CreateTaskAsync(
        Guid projectId, CreateTaskDto dto)
    {
        try
        {
            // ── Validate priority ──────────────────────────────
            if (!WorkTaskPriority.IsValid(dto.Priority))
                return ApiResponse<TaskDto>.Fail(
                    $"Invalid priority '{dto.Priority}'. " +
                    $"Valid: {string.Join(", ", WorkTaskPriority.All)}");

            // ── Verify project exists + in current org ─────────
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return ApiResponse<TaskDto>.Fail("Project not found.");

            var projectGuard = _orgScopeGuard.Check(project.OrganizationId);
            if (!projectGuard.Allowed)
                return ApiResponse<TaskDto>.Fail(projectGuard.Reason!);

            // ── Validate date logic ────────────────────────────
            if (dto.StartDate.HasValue && dto.DueDate.HasValue &&
                dto.DueDate < dto.StartDate)
                return ApiResponse<TaskDto>.Fail(
                    "Due date cannot be before start date.");

            // ── Validate assignee is in same org ───────────────
            if (dto.AssignedToUserId.HasValue)
            {
                var assigneeExists = await _context.Users.AnyAsync(u =>
                    u.Id == dto.AssignedToUserId.Value &&
                    u.OrganizationId == _currentUser.OrganizationId &&
                    u.IsActive);

                if (!assigneeExists)
                    return ApiResponse<TaskDto>.Fail(
                        "Assignee must be an active member of your organization.");
            }

            // ── Validate parent task in same project ───────────
            if (dto.ParentTaskId.HasValue)
            {
                var parentExists = await _context.Tasks.AnyAsync(t =>
                    t.Id == dto.ParentTaskId.Value &&
                    t.ProjectId == projectId);

                if (!parentExists)
                    return ApiResponse<TaskDto>.Fail(
                        "Parent task must exist within the same project.");
            }

            var task = new WorkTask
            {
                Title = dto.Title.Trim(),
                Description = dto.Description?.Trim(),
                Status = WorkTaskStatus.Todo, // Always starts as Todo
                Priority = dto.Priority,
                ProjectId = projectId,
                OrganizationId = _currentUser.OrganizationId,
                CreatedByUserId = _currentUser.UserId,
                AssignedToUserId = dto.AssignedToUserId,
                StartDate = dto.StartDate,
                DueDate = dto.DueDate,
                EstimatedMinutes = dto.EstimatedMinutes,
                ParentTaskId = dto.ParentTaskId,
                OrderIndex = dto.OrderIndex
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            // ── Reload with navigation props ───────────────────
            var created = await _context.Tasks
                .Include(t => t.CreatedBy)
                .Include(t => t.AssignedTo)
                .Include(t => t.Project)
                .Include(t => t.TaskAssignees).ThenInclude(ta => ta.User)
                .Include(t => t.SubTasks)
                .FirstAsync(t => t.Id == task.Id);

            _logger.LogInformation(
                "Task {TaskId} '{Title}' created in project {ProjectId} by {UserId}",
                task.Id, task.Title, projectId, _currentUser.UserId);

            return ApiResponse<TaskDto>.Ok(
                MapToDto(created), "Task created successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating task in project {ProjectId}",
                projectId);
            return ApiResponse<TaskDto>.Fail("An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // UPDATE TASK
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<TaskDto>> UpdateTaskAsync(
        Guid taskId, UpdateTaskDto dto)
    {
        try
        {
            if (!WorkTaskPriority.IsValid(dto.Priority))
                return ApiResponse<TaskDto>.Fail(
                    $"Invalid priority '{dto.Priority}'. " +
                    $"Valid: {string.Join(", ", WorkTaskPriority.All)}");

            var task = await _context.Tasks
                .Include(t => t.CreatedBy)
                .Include(t => t.AssignedTo)
                .Include(t => t.Project)
                .Include(t => t.TaskAssignees).ThenInclude(ta => ta.User)
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                return ApiResponse<TaskDto>.Fail("Task not found.");

            // ✅ Org scope guard
            var guard = _orgScopeGuard.Check(task.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<TaskDto>.Fail(guard.Reason!);

            // ✅ Member ownership check
            // Member can ONLY update tasks assigned to them
            var canManageAll = _permissionService.CurrentUserHasPermission(
                Permissions.Tasks.Update);
            var canUpdateOwn = _permissionService.CurrentUserHasPermission(
                Permissions.Tasks.UpdateOwn);

            if (!canManageAll)
            {
                // Must have at least UpdateOwn permission
                if (!canUpdateOwn)
                    return ApiResponse<TaskDto>.Fail(
                        "You do not have permission to update tasks.");

                // And must be the assigned user
                if (task.AssignedToUserId != _currentUser.UserId)
                    return ApiResponse<TaskDto>.Fail(
                        "You can only update tasks assigned to you.");
            }

            // ── Validate dates ─────────────────────────────────
            if (dto.StartDate.HasValue && dto.DueDate.HasValue &&
                dto.DueDate < dto.StartDate)
                return ApiResponse<TaskDto>.Fail(
                    "Due date cannot be before start date.");

            // ── Validate assignee ──────────────────────────────
            if (dto.AssignedToUserId.HasValue)
            {
                // Only Admin/Owner can reassign
                if (!canManageAll)
                    return ApiResponse<TaskDto>.Fail(
                        "You do not have permission to reassign tasks.");

                var assigneeExists = await _context.Users.AnyAsync(u =>
                    u.Id == dto.AssignedToUserId.Value &&
                    u.OrganizationId == _currentUser.OrganizationId &&
                    u.IsActive);

                if (!assigneeExists)
                    return ApiResponse<TaskDto>.Fail(
                        "Assignee must be an active member of your organization.");
            }

            // ── Apply updates ──────────────────────────────────
            task.Title = dto.Title.Trim();
            task.Description = dto.Description?.Trim();
            task.Priority = dto.Priority;
            task.StartDate = dto.StartDate;
            task.DueDate = dto.DueDate;
            task.EstimatedMinutes = dto.EstimatedMinutes;
            task.ActualMinutes = dto.ActualMinutes;
            task.OrderIndex = dto.OrderIndex;

            // Only Admin/Owner can change assignee
            if (canManageAll)
                task.AssignedToUserId = dto.AssignedToUserId;

            await _context.SaveChangesAsync();

            // Reload assignee nav prop
            if (task.AssignedToUserId.HasValue)
                await _context.Entry(task)
                    .Reference(t => t.AssignedTo).LoadAsync();

            _logger.LogInformation(
                "Task {TaskId} updated by {UserId}", taskId, _currentUser.UserId);

            return ApiResponse<TaskDto>.Ok(
                MapToDto(task), "Task updated successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating task {TaskId}", taskId);
            return ApiResponse<TaskDto>.Fail("An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // CHANGE TASK STATUS
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<TaskDto>> ChangeTaskStatusAsync(
        Guid taskId, ChangeTaskStatusDto dto)
    {
        try
        {
            if (!WorkTaskStatus.IsValid(dto.Status))
                return ApiResponse<TaskDto>.Fail(
                    $"Invalid status '{dto.Status}'. " +
                    $"Valid: {string.Join(", ", WorkTaskStatus.All)}");

            var task = await _context.Tasks
                .Include(t => t.CreatedBy)
                .Include(t => t.AssignedTo)
                .Include(t => t.Project)
                .Include(t => t.TaskAssignees).ThenInclude(ta => ta.User)
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                return ApiResponse<TaskDto>.Fail("Task not found.");

            // ✅ Org scope guard
            var guard = _orgScopeGuard.Check(task.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<TaskDto>.Fail(guard.Reason!);

            // ✅ Member can only change status of their own tasks
            var canManageAll = _permissionService.CurrentUserHasPermission(
                Permissions.Tasks.Update);

            if (!canManageAll)
            {
                var canUpdateOwn = _permissionService.CurrentUserHasPermission(
                    Permissions.Tasks.UpdateOwn);

                if (!canUpdateOwn)
                    return ApiResponse<TaskDto>.Fail(
                        "You do not have permission to change task status.");

                if (task.AssignedToUserId != _currentUser.UserId)
                    return ApiResponse<TaskDto>.Fail(
                        "You can only change the status of tasks assigned to you.");
            }

            var oldStatus = task.Status;
            task.Status = dto.Status;

            // ✅ Set CompletedAt when marking Done
            if (dto.Status == WorkTaskStatus.Done)
            {
                task.CompletedAt = DateTime.UtcNow;
                if (dto.ActualMinutes.HasValue)
                    task.ActualMinutes = dto.ActualMinutes;
            }
            else if (oldStatus == WorkTaskStatus.Done)
            {
                // Reopening a completed task — clear completion date
                task.CompletedAt = null;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Task {TaskId} status changed {Old} → {New} by {UserId}",
                taskId, oldStatus, dto.Status, _currentUser.UserId);

            return ApiResponse<TaskDto>.Ok(
                MapToDto(task),
                $"Task status changed to {dto.Status}.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing status for task {TaskId}", taskId);
            return ApiResponse<TaskDto>.Fail("An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // ASSIGN TASK
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<TaskDto>> AssignTaskAsync(
        Guid taskId, AssignTaskDto dto)
    {
        try
        {
            var task = await _context.Tasks
                .Include(t => t.CreatedBy)
                .Include(t => t.AssignedTo)
                .Include(t => t.Project)
                .Include(t => t.TaskAssignees).ThenInclude(ta => ta.User)
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                return ApiResponse<TaskDto>.Fail("Task not found.");

            // ✅ Org scope guard
            var guard = _orgScopeGuard.Check(task.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<TaskDto>.Fail(guard.Reason!);

            // ── Validate assignee ──────────────────────────────
            if (dto.UserId.HasValue)
            {
                var assigneeExists = await _context.Users.AnyAsync(u =>
                    u.Id == dto.UserId.Value &&
                    u.OrganizationId == _currentUser.OrganizationId &&
                    u.IsActive);

                if (!assigneeExists)
                    return ApiResponse<TaskDto>.Fail(
                        "Assignee must be an active member of your organization.");
            }

            var previousAssignee = task.AssignedToUserId;
            task.AssignedToUserId = dto.UserId;
            await _context.SaveChangesAsync();

            if (task.AssignedToUserId.HasValue)
                await _context.Entry(task)
                    .Reference(t => t.AssignedTo).LoadAsync();

            var message = dto.UserId.HasValue
                ? "Task assigned successfully."
                : "Task unassigned successfully.";

            _logger.LogInformation(
                "Task {TaskId} assigned from {Previous} to {New} by {UserId}",
                taskId, previousAssignee, dto.UserId, _currentUser.UserId);

            return ApiResponse<TaskDto>.Ok(MapToDto(task), message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning task {TaskId}", taskId);
            return ApiResponse<TaskDto>.Fail("An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // DELETE TASK
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<object>> DeleteTaskAsync(Guid taskId)
    {
        try
        {
            var task = await _context.Tasks
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                return ApiResponse<object>.Fail("Task not found.");

            // ✅ Org scope guard
            var guard = _orgScopeGuard.Check(task.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<object>.Fail(guard.Reason!);

            var subTaskCount = task.SubTasks.Count;

            // Soft delete subtasks first
            foreach (var sub in task.SubTasks)
                _context.Tasks.Remove(sub);

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Task {TaskId} deleted by {UserId} — {SubCount} subtasks also removed",
                taskId, _currentUser.UserId, subTaskCount);

            var message = subTaskCount > 0
                ? $"Task deleted. {subTaskCount} subtask(s) also removed."
                : "Task deleted successfully.";

            return ApiResponse<object>.Ok(null!, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting task {TaskId}", taskId);
            return ApiResponse<object>.Fail("An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // PRIVATE MAPPER
    // ════════════════════════════════════════════════════════════
    private static TaskDto MapToDto(WorkTask task) => new()
    {
        Id = task.Id,
        Title = task.Title,
        Description = task.Description,
        Status = task.Status,
        Priority = task.Priority,
        OrderIndex = task.OrderIndex,
        StartDate = task.StartDate,
        DueDate = task.DueDate,
        CompletedAt = task.CompletedAt,
        EstimatedMinutes = task.EstimatedMinutes,
        ActualMinutes = task.ActualMinutes,
        ProjectId = task.ProjectId,
        ProjectName = task.Project?.Name ?? string.Empty,
        OrganizationId = task.OrganizationId,
        CreatedByUserId = task.CreatedByUserId,
        CreatedByName = task.CreatedBy?.FullName ?? "Unknown",
        AssignedToUserId = task.AssignedToUserId,
        AssignedToName = task.AssignedTo?.FullName,
        ParentTaskId = task.ParentTaskId,
        SubTaskCount = task.SubTasks?.Count ?? 0,
        CreatedAt = task.CreatedAt,
        UpdatedAt = task.UpdatedAt,
        AdditionalAssignees = task.TaskAssignees?
            .Select(ta => new TaskAssigneeDto
            {
                UserId = ta.UserId,
                FullName = ta.User?.FullName ?? string.Empty,
                Email = ta.User?.Email ?? string.Empty,
                AssignedAt = ta.AssignedAt
            }).ToList() ?? new()
    };
}