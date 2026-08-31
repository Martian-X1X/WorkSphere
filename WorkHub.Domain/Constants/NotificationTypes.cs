namespace WorkHub.Domain.Constants;

// ── Notification type constants ────────────────────────────────────
// Mirrors what gets stored in Notification.Type column.
// Keep in sync with frontend notification display config.
public static class NotificationTypes
{
    // ── Task notifications ─────────────────────────────────────────
    public const string TaskAssigned       = "TaskAssigned";
    public const string TaskUnassigned     = "TaskUnassigned";
    public const string TaskStatusChanged  = "TaskStatusChanged";
    public const string TaskDueSoon        = "TaskDueSoon";
    public const string TaskOverdue        = "TaskOverdue";
    public const string TaskCompleted      = "TaskCompleted";
    public const string TaskDeleted        = "TaskDeleted";

    // ── Comment notifications ──────────────────────────────────────
    public const string CommentAdded       = "CommentAdded";
    public const string CommentMention     = "CommentMention";

    // ── Project notifications ──────────────────────────────────────
    public const string ProjectCreated        = "ProjectCreated";
    public const string ProjectStatusChanged  = "ProjectStatusChanged";
    public const string ProjectDeleted        = "ProjectDeleted";

    // ── Member notifications ───────────────────────────────────────
    public const string MemberJoined       = "MemberJoined";
    public const string MemberDeactivated  = "MemberDeactivated";
    public const string RoleChanged        = "RoleChanged";

    // ── Invite notifications ───────────────────────────────────────
    public const string InviteAccepted     = "InviteAccepted";
    public const string InviteExpired      = "InviteExpired";
}

// ── Entity types (what the notification is about) ─────────────────
public static class NotificationEntityTypes
{
    public const string Task         = "Task";
    public const string Project      = "Project";
    public const string Comment      = "Comment";
    public const string Member       = "Member";
    public const string Organization = "Organization";
}
