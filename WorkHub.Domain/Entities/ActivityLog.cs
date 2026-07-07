using System.ComponentModel.DataAnnotations;

namespace WorkHub.Domain.Entities;

public class ActivityLog
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // ── WHO ────────────────────────────────────────────────────
    public Guid UserId { get; set; }

    [MaxLength(200)]
    public string UserName { get; set; } = string.Empty;

    // ── WHAT ───────────────────────────────────────────────────
    [Required]
    [MaxLength(50)]
    public string Action { get; set; } = string.Empty;

    // ── WHICH ENTITY ───────────────────────────────────────────
    [Required]
    [MaxLength(50)]
    public string EntityType { get; set; } = string.Empty;

    public Guid EntityId { get; set; }

    // Human-readable entity name (e.g. "Website Redesign")
    [MaxLength(500)]
    public string? EntityName { get; set; }

    // ── CONTEXT ────────────────────────────────────────────────
    // Parent entity — e.g. for a Task, this is the ProjectId
    public Guid? ProjectId { get; set; }

    // ── ORG SCOPE ──────────────────────────────────────────────
    public Guid OrganizationId { get; set; }

    // ── METADATA ───────────────────────────────────────────────
    // JSON string — optional key/value pairs like
    // { "from": "Todo", "to": "Done" } or { "assignedTo": "Alice Johnson" }
    public string? Metadata { get; set; }

    // ── WHEN ───────────────────────────────────────────────────
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation ─────────────────────────────────────────────
    public Organization Organization { get; set; } = null!;
}

// ── Action constants ───────────────────────────────────────────────
public static class ActivityAction
{
    // Project actions
    public const string ProjectCreated      = "ProjectCreated";
    public const string ProjectUpdated      = "ProjectUpdated";
    public const string ProjectStatusChanged = "ProjectStatusChanged";
    public const string ProjectDeleted      = "ProjectDeleted";

    // Task actions
    public const string TaskCreated        = "TaskCreated";
    public const string TaskUpdated        = "TaskUpdated";
    public const string TaskStatusChanged  = "TaskStatusChanged";
    public const string TaskAssigned       = "TaskAssigned";
    public const string TaskUnassigned     = "TaskUnassigned";
    public const string TaskDeleted        = "TaskDeleted";

    // Comment actions
    public const string CommentAdded       = "CommentAdded";
    public const string CommentEdited      = "CommentEdited";
    public const string CommentDeleted     = "CommentDeleted";

    // Member actions
    public const string MemberInvited      = "MemberInvited";
    public const string MemberJoined       = "MemberJoined";
    public const string MemberRoleChanged  = "MemberRoleChanged";
    public const string MemberDeactivated  = "MemberDeactivated";

    // Assignee actions
    public const string CollaboratorAdded   = "CollaboratorAdded";
    public const string CollaboratorRemoved = "CollaboratorRemoved";
}

// ── Entity type constants ──────────────────────────────────────────
public static class ActivityEntityType
{
    public const string Project  = "Project";
    public const string Task     = "Task";
    public const string Comment  = "Comment";
    public const string Member   = "Member";
    public const string Invite   = "Invite";
}