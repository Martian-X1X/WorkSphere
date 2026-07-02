using System.ComponentModel.DataAnnotations;

namespace WorkHub.API.DTOs.Comment;

// ── Response DTO ───────────────────────────────────────────────────
public class CommentDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsEdited { get; set; }
    public DateTime? EditedAt { get; set; }

    // Who wrote it
    public Guid CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public string? CreatedByAvatar { get; set; }

    // Is the current user the author?
    public bool IsOwnComment { get; set; }

    public Guid TaskId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// ── Create request ─────────────────────────────────────────────────
public class CreateCommentDto
{
    [Required(ErrorMessage = "Comment content is required")]
    [MaxLength(4000, ErrorMessage = "Comment cannot exceed 4000 characters")]
    [MinLength(1, ErrorMessage = "Comment cannot be empty")]
    public string Content { get; set; } = string.Empty;
}

// ── Update (edit) request ──────────────────────────────────────────
public class UpdateCommentDto
{
    [Required(ErrorMessage = "Comment content is required")]
    [MaxLength(4000, ErrorMessage = "Comment cannot exceed 4000 characters")]
    [MinLength(1, ErrorMessage = "Comment cannot be empty")]
    public string Content { get; set; } = string.Empty;
}

// ── Query parameters ───────────────────────────────────────────────
public class CommentQueryDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;

    // Sort — newest first or oldest first
    public string SortDirection { get; set; } = "asc"; // oldest first = chronological
}