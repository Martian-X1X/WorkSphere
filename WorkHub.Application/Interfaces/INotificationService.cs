using WorkHub.Application.DTOs.Notifications;

namespace WorkHub.Application.Interfaces;

public interface INotificationService
{
    // ── Create ─────────────────────────────────────────────────────
    /// <summary>
    /// Creates a notification for one user.
    /// This is fire-and-forget safe — exceptions are caught internally.
    /// </summary>
    Task CreateAsync(CreateNotificationDto dto);

    /// <summary>
    /// Creates notifications for multiple users at once.
    /// e.g. notify all org members when a project is created.
    /// </summary>
    Task CreateForUsersAsync(
        IEnumerable<Guid>    userIds,
        CreateNotificationDto template
    );

    // ── Read ───────────────────────────────────────────────────────
    /// <summary>Get paginated notification feed for current user.</summary>
    Task<NotificationFeedDto> GetFeedAsync(
        int  page       = 1,
        int  pageSize   = 20,
        bool unreadOnly = false
    );

    /// <summary>Get unread count for current user (for bell badge).</summary>
    Task<NotificationCountDto> GetCountAsync();

    // ── Mark read ──────────────────────────────────────────────────
    /// <summary>Mark a single notification as read.</summary>
    Task MarkAsReadAsync(Guid notificationId);

    /// <summary>Mark all unread notifications as read.</summary>
    Task MarkAllAsReadAsync();

    /// <summary>Delete a specific notification.</summary>
    Task DeleteAsync(Guid notificationId);

    // ── Helpers (used by other services) ──────────────────────────
    /// <summary>
    /// Notify a user that they were assigned to a task.
    /// Called by TaskService when AssignedToUserId changes.
    /// </summary>
    Task NotifyTaskAssignedAsync(
        Guid   assigneeUserId,
        Guid   organizationId,
        string taskTitle,
        Guid   taskId,
        string projectName,
        Guid   assignedByUserId,
        string assignedByName
    );

    /// <summary>
    /// Notify task owner/assignee that a comment was added.
    /// </summary>
    Task NotifyCommentAddedAsync(
        Guid   taskOwnerId,
        Guid   organizationId,
        string taskTitle,
        Guid   taskId,
        string commenterName,
        Guid   commenterUserId
    );

    /// <summary>
    /// Notify org Owner/Admins that a new member joined.
    /// </summary>
    Task NotifyMemberJoinedAsync(
        Guid   organizationId,
        string newMemberName,
        Guid   newMemberId,
        string role
    );

    /// <summary>
    /// Notify the person who sent an invite that it was accepted.
    /// </summary>
    Task NotifyInviteAcceptedAsync(
        Guid   inviterUserId,
        Guid   organizationId,
        string newMemberName,
        string newMemberEmail
    );

    /// <summary>
    /// Notify all org members that a new project was created.
    /// </summary>
    Task NotifyProjectCreatedAsync(
        Guid   organizationId,
        string projectName,
        Guid   projectId,
        Guid   createdByUserId,
        string createdByName
    );
}
