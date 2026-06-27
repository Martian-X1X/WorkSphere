using System.ComponentModel.DataAnnotations;

namespace WorkHub.API.DTOs.Project;

// ── Response DTO ───────────────────────────────────────────────────
public class ProjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public Guid? ProjectLeadUserId { get; set; }
    public string? ProjectLeadName { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Task summary — computed on fetch
    public TaskSummaryDto TaskSummary { get; set; } = new();
}

// ── Task summary inside a project response ─────────────────────────
public class TaskSummaryDto
{
    public int Total { get; set; }
    public int Todo { get; set; }
    public int InProgress { get; set; }
    public int InReview { get; set; }
    public int Done { get; set; }
    public int Cancelled { get; set; }

    // Completion percentage — computed
    public int CompletionPercentage =>
        Total == 0 ? 0 : (int)Math.Round((double)Done / Total * 100);
}

// ── Create request ─────────────────────────────────────────────────
public class CreateProjectDto
{
    [Required(ErrorMessage = "Project name is required")]
    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string? Description { get; set; }

    public Guid? ProjectLeadUserId { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? DueDate { get; set; }
}

// ── Update request ─────────────────────────────────────────────────
public class UpdateProjectDto
{
    [Required(ErrorMessage = "Project name is required")]
    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string? Description { get; set; }

    public Guid? ProjectLeadUserId { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? DueDate { get; set; }
}

// ── Status change request ──────────────────────────────────────────
public class ChangeProjectStatusDto
{
    [Required(ErrorMessage = "Status is required")]
    public string Status { get; set; } = string.Empty;
}

// ── Query parameters for list endpoint ────────────────────────────
public class ProjectQueryDto
{
    // Filter by status — null means all
    public string? Status { get; set; }

    // Search by name
    public string? Search { get; set; }

    // Sort field
    public string SortBy { get; set; } = "createdAt";

    // Sort direction
    public string SortDirection { get; set; } = "desc";

    // Pagination
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}