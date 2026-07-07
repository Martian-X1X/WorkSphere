using Microsoft.EntityFrameworkCore;
using WorkHub.Application.Authorization;
using WorkHub.Infrastructure.Data;
using WorkHub.Application.DTOs.Comment;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.DTOs.Organization;
using WorkHub.Application.Interfaces;
using WorkHub.Domain.Entities;

namespace WorkHub.Application.Services;

public class CommentService : ICommentService
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IPermissionService _permissionService;
    private readonly OrgScopeGuard _orgScopeGuard;
    private readonly IActivityService _activityService;
    private readonly ILogger<CommentService> _logger;

    public CommentService(
        AppDbContext context,
        ICurrentUserService currentUser,
        IPermissionService permissionService,
        OrgScopeGuard orgScopeGuard,
        IActivityService activityService,
        ILogger<CommentService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _permissionService = permissionService;
        _orgScopeGuard = orgScopeGuard;
        _activityService = activityService;
        _logger = logger;
    }

    // ════════════════════════════════════════════════════════════
    // GET COMMENTS
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<PagedResult<CommentDto>>> GetCommentsAsync(
        Guid taskId, CommentQueryDto query)
    {
        try
        {
            query.Page = Math.Max(1, query.Page);
            query.PageSize = Math.Clamp(query.PageSize, 1, 100);

            // ── Verify task exists + belongs to current org ────
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                return ApiResponse<PagedResult<CommentDto>>.Fail(
                    "Task not found.");

            var taskGuard = _orgScopeGuard.Check(task.OrganizationId);
            if (!taskGuard.Allowed)
                return ApiResponse<PagedResult<CommentDto>>.Fail(
                    taskGuard.Reason!);

            // ── Query comments ─────────────────────────────────
            var baseQuery = _context.Comments
                .Include(c => c.CreatedBy)
                .Where(c => c.TaskId == taskId);

            // ── Sort ───────────────────────────────────────────
            baseQuery = query.SortDirection == "desc"
                ? baseQuery.OrderByDescending(c => c.CreatedAt)
                : baseQuery.OrderBy(c => c.CreatedAt);

            var totalCount = await baseQuery.CountAsync();
            var comments = await baseQuery
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            var result = new PagedResult<CommentDto>
            {
                Items = comments.Select(c => MapToDto(c)).ToList(),
                TotalCount = totalCount,
                Page = query.Page,
                PageSize = query.PageSize
            };

            return ApiResponse<PagedResult<CommentDto>>.Ok(result,
                $"{totalCount} comment(s) found.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting comments for task {TaskId}",
                taskId);
            return ApiResponse<PagedResult<CommentDto>>.Fail(
                "An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // CREATE COMMENT
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<CommentDto>> CreateCommentAsync(
        Guid taskId, CreateCommentDto dto)
    {
        try
        {
            // ── Verify task exists + in current org ────────────
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                return ApiResponse<CommentDto>.Fail("Task not found.");

            var taskGuard = _orgScopeGuard.Check(task.OrganizationId);
            if (!taskGuard.Allowed)
                return ApiResponse<CommentDto>.Fail(taskGuard.Reason!);

            var comment = new Comment
            {
                Content = dto.Content.Trim(),
                TaskId = taskId,
                OrganizationId = _currentUser.OrganizationId,
                CreatedByUserId = _currentUser.UserId,
                IsEdited = false
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            // Get task title for the log
            var taskTitle = await _context.Tasks
                .Where(t => t.Id == taskId)
                .Select(t => t.Title)
                .FirstOrDefaultAsync();

            await _activityService.LogAsync(
                ActivityAction.CommentAdded,
                ActivityEntityType.Comment,
                comment.Id,
                entityName: taskTitle,
                projectId: taskId); // store taskId in ProjectId for easy task-level querying

            // ── Reload with navigation props ───────────────────
            var created = await _context.Comments
                .Include(c => c.CreatedBy)
                .FirstAsync(c => c.Id == comment.Id);

            _logger.LogInformation(
                "Comment {CommentId} created on task {TaskId} by {UserId}",
                comment.Id, taskId, _currentUser.UserId);

            return ApiResponse<CommentDto>.Ok(
                MapToDto(created), "Comment posted successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating comment on task {TaskId}",
                taskId);
            return ApiResponse<CommentDto>.Fail(
                "An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // UPDATE COMMENT (edit own only)
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<CommentDto>> UpdateCommentAsync(
        Guid commentId, UpdateCommentDto dto)
    {
        try
        {
            var comment = await _context.Comments
                .Include(c => c.CreatedBy)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null)
                return ApiResponse<CommentDto>.Fail("Comment not found.");

            // ✅ Org scope guard
            var guard = _orgScopeGuard.Check(comment.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<CommentDto>.Fail(guard.Reason!);

            // ✅ Only the author can edit their own comment
            if (comment.CreatedByUserId != _currentUser.UserId)
                return ApiResponse<CommentDto>.Fail(
                    "You can only edit your own comments.");

            comment.Content = dto.Content.Trim();
            comment.IsEdited = true;
            comment.EditedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var taskTitle = await _context.Tasks
                .Where(t => t.Id == comment.TaskId)
                .Select(t => t.Title)
                .FirstOrDefaultAsync();

            await _activityService.LogAsync(
                ActivityAction.CommentEdited,
                ActivityEntityType.Comment,
                commentId,
                entityName: taskTitle,
                projectId: comment.TaskId);

            _logger.LogInformation(
                "Comment {CommentId} edited by {UserId}",
                commentId, _currentUser.UserId);

            return ApiResponse<CommentDto>.Ok(
                MapToDto(comment), "Comment updated successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating comment {CommentId}",
                commentId);
            return ApiResponse<CommentDto>.Fail(
                "An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // DELETE COMMENT
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<object>> DeleteCommentAsync(Guid commentId)
    {
        try
        {
            var comment = await _context.Comments
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null)
                return ApiResponse<object>.Fail("Comment not found.");

            // ✅ Org scope guard
            var guard = _orgScopeGuard.Check(comment.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<object>.Fail(guard.Reason!);

            // ✅ Permission check:
            // Admin/Owner → can delete ANY comment
            // Member → can only delete their OWN comment
            var canDeleteAny = _permissionService.CurrentUserHasPermission(
                Permissions.Comments.Delete);

            var canDeleteOwn = _permissionService.CurrentUserHasPermission(
                Permissions.Comments.DeleteOwn);

            if (!canDeleteAny)
            {
                if (!canDeleteOwn)
                    return ApiResponse<object>.Fail(
                        "You do not have permission to delete comments.");

                if (comment.CreatedByUserId != _currentUser.UserId)
                    return ApiResponse<object>.Fail(
                        "You can only delete your own comments.");
            }

            var taskId = comment.TaskId;
            var taskTitle = await _context.Tasks
                .Where(t => t.Id == taskId)
                .Select(t => t.Title)
                .FirstOrDefaultAsync();

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            await _activityService.LogAsync(
                ActivityAction.CommentDeleted,
                ActivityEntityType.Comment,
                commentId,
                entityName: taskTitle,
                projectId: taskId);

            _logger.LogInformation(
                "Comment {CommentId} deleted by {UserId}",
                commentId, _currentUser.UserId);

            return ApiResponse<object>.Ok(null!,
                "Comment deleted successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting comment {CommentId}",
                commentId);
            return ApiResponse<object>.Fail(
                "An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // PRIVATE MAPPER
    // ════════════════════════════════════════════════════════════
    private CommentDto MapToDto(Comment comment) => new()
    {
        Id = comment.Id,
        Content = comment.Content,
        IsEdited = comment.IsEdited,
        EditedAt = comment.EditedAt,
        CreatedByUserId = comment.CreatedByUserId,
        CreatedByName = comment.CreatedBy?.FullName ?? "Unknown",
        CreatedByAvatar = comment.CreatedBy?.ProfilePictureUrl,
        IsOwnComment = comment.CreatedByUserId == _currentUser.UserId,
        TaskId = comment.TaskId,
        CreatedAt = comment.CreatedAt,
        UpdatedAt = comment.UpdatedAt
    };
}