using System.ComponentModel.DataAnnotations;

namespace WorkHub.API.DTOs.Task;

// ── Add assignee request ───────────────────────────────────────────
public class AddAssigneeDto
{
    [Required(ErrorMessage = "User ID is required")]
    public Guid UserId { get; set; }
}

// ── Full assignee list response (primary + additional) ─────────────
public class TaskAssigneeListDto
{
    public Guid TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;

    // The single primary assignee (nullable)
    public PrimaryAssigneeDto? PrimaryAssignee { get; set; }

    // All additional collaborators
    public List<TaskAssigneeDto> Collaborators { get; set; } = new();

    public int TotalAssigneeCount =>
        (PrimaryAssignee != null ? 1 : 0) + Collaborators.Count;
}

public class PrimaryAssigneeDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

// ── "My Tasks" query parameters ─────────────────────────────────────
public class MyTasksQueryDto
{
    public string? Status { get; set; }
    public string? Priority { get; set; }

    // true = only show tasks with a due date in the past and not Done
    public bool? Overdue { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

// ── "My Tasks" response — includes project context ─────────────────
public class MyTaskDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public bool IsOverdue { get; set; }

    // Why is this task showing up for me?
    public string AssignmentType { get; set; } = string.Empty; // "Primary" or "Collaborator"

    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
}