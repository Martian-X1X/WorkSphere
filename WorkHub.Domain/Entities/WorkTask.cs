using System.ComponentModel.DataAnnotations;

namespace WorkHub.Domain.Entities;
public class WorkTask : BaseEntity
{
    // ── Core fields ────────────────────────────────────────────
    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? Description { get; set; }

    // ── Status + Priority ──────────────────────────────────────
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = WorkTaskStatus.Todo;

    [Required]
    [MaxLength(20)]
    public string Priority { get; set; } = WorkTaskPriority.Medium;

    // ── Dates ──────────────────────────────────────────────────
    public DateTime? DueDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? CompletedAt { get; set; }

    // ── Time tracking ──────────────────────────────────────────
    // Stored in minutes for precision
    public int? EstimatedMinutes { get; set; }
    public int? ActualMinutes { get; set; }

    // ── Ordering ───────────────────────────────────────────────
    // Used for drag-and-drop kanban ordering
    public int OrderIndex { get; set; } = 0;

    // ── Subtask support ────────────────────────────────────────
    // Nullable — if set, this task is a subtask of another task
    public Guid? ParentTaskId { get; set; }

    // ── Foreign keys ───────────────────────────────────────────
    public Guid ProjectId { get; set; }
    public Guid OrganizationId { get; set; }
    public Guid CreatedByUserId { get; set; }

    // Primary assignee — kept for simple single-assignee queries
    // Full multi-assignee via TaskAssignees junction table
    public Guid? AssignedToUserId { get; set; }

    // ── Navigation properties ──────────────────────────────────
    public Project Project { get; set; } = null!;
    public Organization Organization { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
    public User? AssignedTo { get; set; }
    public WorkTask? ParentTask { get; set; }
    public ICollection<WorkTask> SubTasks { get; set; } = new List<WorkTask>();
    public ICollection<TaskAssignee> TaskAssignees { get; set; } = new List<TaskAssignee>();
}

// ── Status constants ───────────────────────────────────────────────
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

// ── Priority constants ─────────────────────────────────────────────
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