namespace WorkHub.Application.DTOs.Notifications;

// ── Single notification response ───────────────────────────────────
public class NotificationDto
{
    public Guid    Id            { get; set; }
    public string  Type          { get; set; } = string.Empty;
    public string  Title         { get; set; } = string.Empty;
    public string  Message       { get; set; } = string.Empty;
    public string? EntityType    { get; set; }
    public Guid?   EntityId      { get; set; }
    public string? ActionUrl     { get; set; }
    public string? CreatedByName { get; set; }
    public bool    IsRead        { get; set; }
    public DateTime? ReadAt      { get; set; }
    public DateTime  CreatedAt   { get; set; }
    public string?   Metadata    { get; set; }
}

// ── Unread count response ──────────────────────────────────────────
public class NotificationCountDto
{
    public int UnreadCount { get; set; }
    public int TotalCount  { get; set; }
}

// ── Create notification request (internal use) ─────────────────────
public class CreateNotificationDto
{
    public Guid    UserId          { get; set; }
    public Guid    OrganizationId  { get; set; }
    public string  Type            { get; set; } = string.Empty;
    public string  Title           { get; set; } = string.Empty;
    public string  Message         { get; set; } = string.Empty;
    public string? EntityType      { get; set; }
    public Guid?   EntityId        { get; set; }
    public string? ActionUrl       { get; set; }
    public Guid?   CreatedByUserId { get; set; }
    public string? CreatedByName   { get; set; }
    public string? Metadata        { get; set; }
}

// ── Notification feed response ─────────────────────────────────────
public class NotificationFeedDto
{
    public List<NotificationDto> Items       { get; set; } = [];
    public int                   UnreadCount { get; set; }
    public int                   TotalCount  { get; set; }
    public bool                  HasMore     { get; set; }
}
