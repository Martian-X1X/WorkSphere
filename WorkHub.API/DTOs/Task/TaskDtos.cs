using System.ComponentModel.DataAnnotations;

namespace WorkHub.API.DTOs.Task;

// ── Response DTO ───────────────────────────────────────────────────
public class TaskDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public int OrderIndex { get; set; }

    // Dates
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Time tracking
    public int? EstimatedMinutes { get; set; }
    public int? ActualMinutes { get; set; }

    // Computed helper
    public string? EstimatedHours => EstimatedMinutes.HasValue
        ? $"{EstimatedMinutes / 60}h {EstimatedMinutes % 60}m" : null;

    // Relations
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }

    // Audit
    public Guid CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;

    // Primary assignee
    public Guid? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }

    // Subtask support
    public Guid? ParentTaskId { get; set; }
    public int SubTaskCount { get; set; }

    // Additional assignees
    public List<TaskAssigneeDto> AdditionalAssignees { get; set; } = new();

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// ── Additional assignee inside task response ───────────────────────
public class TaskAssigneeDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
}

// ── Create task request ────────────────────────────────────────────
public class CreateTaskDto
{
    [Required(ErrorMessage = "Task title is required")]
    [MaxLength(500, ErrorMessage = "Title cannot exceed 500 characters")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(4000, ErrorMessage = "Description cannot exceed 4000 characters")]
    public string? Description { get; set; }

    public string Priority { get; set; } = "Medium";

    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }

    public int? EstimatedMinutes { get; set; }

    public Guid? AssignedToUserId { get; set; }

    public Guid? ParentTaskId { get; set; }

    public int OrderIndex { get; set; } = 0;
}

// ── Update task request ────────────────────────────────────────────
public class UpdateTaskDto
{
    [Required(ErrorMessage = "Task title is required")]
    [MaxLength(500, ErrorMessage = "Title cannot exceed 500 characters")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(4000, ErrorMessage = "Description cannot exceed 4000 characters")]
    public string? Description { get; set; }

    public string Priority { get; set; } = "Medium";

    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }

    public int? EstimatedMinutes { get; set; }
    public int? ActualMinutes { get; set; }

    public Guid? AssignedToUserId { get; set; }

    public int OrderIndex { get; set; } = 0;
}

// ── Status change request ──────────────────────────────────────────
public class ChangeTaskStatusDto
{
    [Required(ErrorMessage = "Status is required")]
    public string Status { get; set; } = string.Empty;

    // Optional — actual minutes when marking Done
    public int? ActualMinutes { get; set; }
}

// ── Assign task request ────────────────────────────────────────────
public class AssignTaskDto
{
    // Null = unassign
    public Guid? UserId { get; set; }
}

// ── Query parameters ───────────────────────────────────────────────
public class TaskQueryDto
{
    // Filter
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public string? Search { get; set; }

    // Sort
    public string SortBy { get; set; } = "orderIndex";
    public string SortDirection { get; set; } = "asc";

    // Pagination
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}