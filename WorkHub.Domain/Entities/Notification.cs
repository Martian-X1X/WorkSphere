using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WorkHub.Domain.Entities;

/// <summary>
/// In-app notification for a specific user.
/// Notifications are NOT soft-deleted — they are marked as read
/// or automatically cleaned up after 90 days.
/// </summary>
public class Notification
{
    // ── Identity ───────────────────────────────────────────────────
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    // ── Recipient (who sees this notification) ─────────────────────
    public Guid UserId         { get; set; }
    public Guid OrganizationId { get; set; }

    // ── Content ────────────────────────────────────────────────────
    /// <summary>Notification type key (e.g. "TaskAssigned")</summary>
    [MaxLength(100)]
    public string Type    { get; set; } = string.Empty;

    /// <summary>Short heading shown in notification bell</summary>
    [MaxLength(200)]
    public string Title   { get; set; } = string.Empty;

    /// <summary>Full description shown in dropdown</summary>
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    // ── Navigation target ──────────────────────────────────────────
    /// <summary>Type of the related entity (Task, Project, etc.)</summary>
    [MaxLength(50)]
    public string? EntityType { get; set; }

    /// <summary>ID of the related entity to navigate to</summary>
    public Guid? EntityId { get; set; }

    /// <summary>Frontend route to navigate on click (e.g. /tasks/{id})</summary>
    [MaxLength(500)]
    public string? ActionUrl { get; set; }

    // ── Actor (who triggered this notification) ────────────────────
    public Guid?   CreatedByUserId { get; set; }

    /// <summary>Snapshot of actor's name at time of creation</summary>
    [MaxLength(200)]
    public string? CreatedByName   { get; set; }

    // ── Read state ─────────────────────────────────────────────────
    public bool      IsRead  { get; set; } = false;
    public DateTime? ReadAt  { get; set; }

    // ── Extra data ─────────────────────────────────────────────────
    /// <summary>
    /// JSON bag for type-specific extra data.
    /// e.g. { "projectName": "Website Redesign", "oldStatus": "Todo" }
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string? Metadata { get; set; }

    // ── Timestamps ─────────────────────────────────────────────────
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation properties ──────────────────────────────────────
    [ForeignKey(nameof(UserId))]
    public virtual User? User { get; set; }

    [ForeignKey(nameof(OrganizationId))]
    public virtual Organization? Organization { get; set; }

    [ForeignKey(nameof(CreatedByUserId))]
    public virtual User? CreatedBy { get; set; }
}
