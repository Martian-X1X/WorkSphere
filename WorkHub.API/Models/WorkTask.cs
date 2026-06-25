using System.ComponentModel.DataAnnotations;

namespace WorkHub.API.Models;

public class WorkTask : BaseEntity
{
    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = WorkTaskStatus.Todo;

    [Required]
    [MaxLength(20)]
    public string Priority { get; set; } = WorkTaskPriority.Medium;

    public DateTime? DueDate { get; set; }

    // ── Foreign keys ───────────────────────────────────────────
    public Guid ProjectId { get; set; }
    public Guid OrganizationId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public Guid? AssignedToUserId { get; set; }

    // ── Navigation properties ──────────────────────────────────
    public Project Project { get; set; } = null!;
    public Organization Organization { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
    public User? AssignedTo { get; set; }
}

public static class WorkTaskStatus
{
    public const string Todo       = "Todo";
    public const string InProgress = "InProgress";
    public const string InReview   = "InReview";
    public const string Done       = "Done";
    public const string Cancelled  = "Cancelled";

    public static bool IsValid(string status) =>
        status is Todo or InProgress or InReview or Done or Cancelled;

    public static readonly string[] All =
        { Todo, InProgress, InReview, Done, Cancelled };
}

public static class WorkTaskPriority
{
    public const string Low    = "Low";
    public const string Medium = "Medium";
    public const string High   = "High";
    public const string Urgent = "Urgent";

    public static bool IsValid(string priority) =>
        priority is Low or Medium or High or Urgent;

    public static readonly string[] All = { Low, Medium, High, Urgent };
}