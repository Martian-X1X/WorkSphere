using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkHub.API.Authorization;
using WorkHub.API.DTOs.Comment;
using WorkHub.API.DTOs.Common;
using WorkHub.API.DTOs.Organization;
using WorkHub.API.Interfaces;

namespace WorkHub.API.Controllers;

[ApiController]
[Produces("application/json")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly ILogger<CommentsController> _logger;

    public CommentsController(
        ICommentService commentService,
        ILogger<CommentsController> logger)
    {
        _commentService = commentService;
        _logger = logger;
    }

    /// <summary>
    /// Get all comments on a task — paginated, chronological.
    /// All roles can view comments.
    /// </summary>
    [HttpGet("api/tasks/{taskId:guid}/comments")]
    [Authorize(Policy = PolicyNames.CanViewComments)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CommentDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CommentDto>>), 404)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> GetComments(
        Guid taskId,
        [FromQuery] CommentQueryDto query)
    {
        var result = await _commentService.GetCommentsAsync(taskId, query);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Post a comment on a task.
    /// All roles can comment.
    /// </summary>
    [HttpPost("api/tasks/{taskId:guid}/comments")]
    [Authorize(Policy = PolicyNames.CanCreateComments)]
    [ProducesResponseType(typeof(ApiResponse<CommentDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<CommentDto>), 400)]
    [ProducesResponseType(typeof(ApiResponse<CommentDto>), 404)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> CreateComment(
        Guid taskId,
        [FromBody] CreateCommentDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<CommentDto>.Fail(errors));
        }

        var result = await _commentService.CreateCommentAsync(taskId, dto);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return StatusCode(201, result);
    }

    /// <summary>
    /// Edit your own comment.
    /// Any role can edit their own comments only.
    /// </summary>
    [HttpPut("api/tasks/{taskId:guid}/comments/{commentId:guid}")]
    [Authorize(Policy = PolicyNames.CanCreateComments)]
    [ProducesResponseType(typeof(ApiResponse<CommentDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<CommentDto>), 400)]
    [ProducesResponseType(typeof(ApiResponse<CommentDto>), 404)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> UpdateComment(
        Guid taskId,
        Guid commentId,
        [FromBody] UpdateCommentDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<CommentDto>.Fail(errors));
        }

        var result = await _commentService.UpdateCommentAsync(commentId, dto);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Delete a comment.
    /// Owner/Admin → can delete any comment.
    /// Member → can only delete their own.
    /// </summary>
    [HttpDelete("api/tasks/{taskId:guid}/comments/{commentId:guid}")]
    [Authorize(Policy = PolicyNames.CanViewComments)]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> DeleteComment(
        Guid taskId,
        Guid commentId)
    {
        var result = await _commentService.DeleteCommentAsync(commentId);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }
}