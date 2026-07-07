using System.ComponentModel.DataAnnotations;

namespace WorkHub.Domain.Entities;
public class Comment : BaseEntity
{
    // ── Content ────────────────────────────────────────────────
    [Required]
    [MaxLength(4000)]
    public string Content { get; set; } = string.Empty;

    // ── Was this comment edited? ───────────────────────────────
    public bool IsEdited { get; set; } = false;
    public DateTime? EditedAt { get; set; }

    // ── Foreign keys ───────────────────────────────────────────
    public Guid TaskId { get; set; }
    public Guid OrganizationId { get; set; }
    public Guid CreatedByUserId { get; set; }

    // ── Navigation properties ──────────────────────────────────
    public WorkTask Task { get; set; } = null!;
    public Organization Organization { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
}