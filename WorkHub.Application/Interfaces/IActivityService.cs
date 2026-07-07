using WorkHub.Domain.Entities;

namespace WorkHub.Application.Interfaces;

public interface IActivityService
{
    /// <summary>
    /// Log an activity event.
    /// Call this after every successful create/update/delete operation.
    /// Non-blocking — failures are caught and logged without breaking the main flow.
    /// </summary>
    Task LogAsync(
        string action,
        string entityType,
        Guid entityId,
        string? entityName = null,
        Guid? projectId = null,
        object? metadata = null);

    /// <summary>
    /// Get paginated activity for the entire organization.
    /// </summary>
    Task<List<ActivityLogDto>> GetOrgActivityAsync(
        int page = 1, int pageSize = 50);

    /// <summary>
    /// Get paginated activity for a specific project
    /// (includes both project-level and task-level events).
    /// </summary>
    Task<List<ActivityLogDto>> GetProjectActivityAsync(
        Guid projectId, int page = 1, int pageSize = 50);

    /// <summary>
    /// Get paginated activity for a specific task.
    /// </summary>
    Task<List<ActivityLogDto>> GetTaskActivityAsync(
        Guid taskId, int page = 1, int pageSize = 50);
}

// ── Activity response DTO ──────────────────────────────────────────
public class ActivityLogDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string? EntityName { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? Metadata { get; set; }
    public DateTime CreatedAt { get; set; }

    // Human-readable description — built from action + entityName
    public string Description => BuildDescription();

    private string BuildDescription()
    {
        return Action switch
        {
            "ProjectCreated"       => $"created project \"{EntityName}\"",
            "ProjectUpdated"       => $"updated project \"{EntityName}\"",
            "ProjectStatusChanged" => $"changed project \"{EntityName}\" status",
            "ProjectDeleted"       => $"deleted project \"{EntityName}\"",
            "TaskCreated"          => $"created task \"{EntityName}\"",
            "TaskUpdated"          => $"updated task \"{EntityName}\"",
            "TaskStatusChanged"    => $"changed status of task \"{EntityName}\"",
            "TaskAssigned"         => $"assigned task \"{EntityName}\"",
            "TaskUnassigned"       => $"unassigned task \"{EntityName}\"",
            "TaskDeleted"          => $"deleted task \"{EntityName}\"",
            "CommentAdded"         => $"commented on task \"{EntityName}\"",
            "CommentEdited"        => $"edited a comment on task \"{EntityName}\"",
            "CommentDeleted"       => $"deleted a comment on task \"{EntityName}\"",
            "MemberInvited"        => $"invited {EntityName} to the organization",
            "MemberJoined"         => $"{EntityName} joined the organization",
            "MemberRoleChanged"    => $"changed role of {EntityName}",
            "MemberDeactivated"    => $"deactivated {EntityName}",
            "CollaboratorAdded"    => $"added {EntityName} as a collaborator",
            "CollaboratorRemoved"  => $"removed {EntityName} as a collaborator",
            _                      => $"performed {Action} on {EntityName}"
        };
    }
}