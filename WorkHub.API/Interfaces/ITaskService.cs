using WorkHub.API.DTOs.Common;
using WorkHub.API.DTOs.Organization;
using WorkHub.API.DTOs.Task;

namespace WorkHub.API.Interfaces;

public interface ITaskService
{
    /// <summary>
    /// Get paginated tasks for a project.
    /// Supports filtering by status, priority, assignee, search.
    /// </summary>
    Task<ApiResponse<PagedResult<TaskDto>>> GetTasksAsync(
        Guid projectId, TaskQueryDto query);

    /// <summary>
    /// Get a single task by ID.
    /// OrgScopeGuard enforced — cross-org access blocked.
    /// </summary>
    Task<ApiResponse<TaskDto>> GetTaskByIdAsync(Guid taskId);

    /// <summary>
    /// Create a task inside a project.
    /// Owner/Admin only.
    /// </summary>
    Task<ApiResponse<TaskDto>> CreateTaskAsync(
        Guid projectId, CreateTaskDto dto);

    /// <summary>
    /// Update task fields.
    /// Admin/Owner can update any task.
    /// Member can update ONLY tasks assigned to them.
    /// </summary>
    Task<ApiResponse<TaskDto>> UpdateTaskAsync(
        Guid taskId, UpdateTaskDto dto);

    /// <summary>
    /// Change task status.
    /// Admin/Owner: any task.
    /// Member: only tasks assigned to them.
    /// </summary>
    Task<ApiResponse<TaskDto>> ChangeTaskStatusAsync(
        Guid taskId, ChangeTaskStatusDto dto);

    /// <summary>
    /// Assign or reassign a task.
    /// Only Owner/Admin can assign tasks.
    /// Pass null UserId to unassign.
    /// </summary>
    Task<ApiResponse<TaskDto>> AssignTaskAsync(
        Guid taskId, AssignTaskDto dto);

    /// <summary>
    /// Soft delete a task.
    /// Owner/Admin only.
    /// </summary>
    Task<ApiResponse<object>> DeleteTaskAsync(Guid taskId);

    /// <summary>Get primary assignee + all collaborators for a task.</summary>
    Task<ApiResponse<TaskAssigneeListDto>> GetTaskAssigneesAsync(Guid taskId);

    /// <summary>Add a collaborator to a task. Owner/Admin only.</summary>
    Task<ApiResponse<TaskAssigneeListDto>> AddAssigneeAsync(
        Guid taskId, AddAssigneeDto dto);

    /// <summary>Remove a collaborator from a task. Owner/Admin only.</summary>
    Task<ApiResponse<TaskAssigneeListDto>> RemoveAssigneeAsync(
        Guid taskId, Guid userId);

    /// <summary>
    /// Get all tasks assigned to the current user (primary OR collaborator)
    /// across every project in their organization.
    /// </summary>
    Task<ApiResponse<PagedResult<MyTaskDto>>> GetMyTasksAsync(
        MyTasksQueryDto query);
}