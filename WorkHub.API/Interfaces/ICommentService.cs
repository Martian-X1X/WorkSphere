using WorkHub.API.DTOs.Comment;
using WorkHub.API.DTOs.Common;
using WorkHub.API.DTOs.Organization;

namespace WorkHub.API.Interfaces;

public interface ICommentService
{
    /// <summary>
    /// Get paginated comments for a task.
    /// Sorted chronologically by default (oldest first).
    /// </summary>
    Task<ApiResponse<PagedResult<CommentDto>>> GetCommentsAsync(
        Guid taskId, CommentQueryDto query);

    /// <summary>
    /// Create a comment on a task.
    /// All roles can comment.
    /// </summary>
    Task<ApiResponse<CommentDto>> CreateCommentAsync(
        Guid taskId, CreateCommentDto dto);

    /// <summary>
    /// Edit a comment.
    /// Any role can edit their OWN comments.
    /// Marks IsEdited = true and sets EditedAt.
    /// </summary>
    Task<ApiResponse<CommentDto>> UpdateCommentAsync(
        Guid commentId, UpdateCommentDto dto);

    /// <summary>
    /// Delete a comment.
    /// Owner/Admin can delete ANY comment.
    /// Member can only delete their OWN comments.
    /// Soft delete — comment is hidden but recoverable.
    /// </summary>
    Task<ApiResponse<object>> DeleteCommentAsync(Guid commentId);
}