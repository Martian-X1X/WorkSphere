using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.DTOs.Notifications;
using WorkHub.Application.Interfaces;

namespace WorkHub.API.Controllers;

/// <summary>
/// In-app notification management for the current user.
/// All endpoints are scoped to the authenticated user's notifications only.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        INotificationService notificationService,
        ILogger<NotificationsController> logger)
    {
        _notificationService = notificationService;
        _logger              = logger;
    }

    // ── GET /api/notifications ─────────────────────────────────────
    /// <summary>
    /// Get paginated notification feed for the current user.
    /// Returns newest notifications first.
    /// </summary>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 20, max: 50)</param>
    /// <param name="unreadOnly">If true, only returns unread notifications</param>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<NotificationFeedDto>), 200)]
    public async Task<IActionResult> GetFeed(
        [FromQuery] int  page       = 1,
        [FromQuery] int  pageSize   = 20,
        [FromQuery] bool unreadOnly = false)
    {
        // Clamp values to safe range
        page     = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var feed = await _notificationService.GetFeedAsync(
            page, pageSize, unreadOnly);

        return Ok(ApiResponse<NotificationFeedDto>.Ok(
            feed,
            $"{feed.TotalCount} notification(s) found."
        ));
    }

    // ── GET /api/notifications/count ───────────────────────────────
    /// <summary>
    /// Get unread notification count for the current user.
    /// Optimized for frequent polling (bell badge).
    /// </summary>
    [HttpGet("count")]
    [ResponseCache(Duration = 10, VaryByHeader = "Authorization")]
    [ProducesResponseType(typeof(ApiResponse<NotificationCountDto>), 200)]
    public async Task<IActionResult> GetCount()
    {
        var count = await _notificationService.GetCountAsync();

        return Ok(ApiResponse<NotificationCountDto>.Ok(
            count,
            "Notification count retrieved."
        ));
    }

    // ── PATCH /api/notifications/{id}/read ────────────────────────
    /// <summary>
    /// Mark a single notification as read.
    /// Only the notification owner can mark it read.
    /// </summary>
    /// <param name="id">Notification ID</param>
    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> MarkAsRead([FromRoute] Guid id)
    {
        await _notificationService.MarkAsReadAsync(id);

        return Ok(ApiResponse<object>.Ok(
            null!,
            "Notification marked as read."
        ));
    }

    // ── PATCH /api/notifications/read-all ─────────────────────────
    /// <summary>
    /// Mark ALL unread notifications as read for the current user.
    /// </summary>
    [HttpPatch("read-all")]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _notificationService.MarkAllAsReadAsync();

        return Ok(ApiResponse<object>.Ok(
            null!,
            "All notifications marked as read."
        ));
    }

    // ── DELETE /api/notifications/{id} ────────────────────────────
    /// <summary>
    /// Delete a single notification.
    /// Only the notification owner can delete it.
    /// </summary>
    /// <param name="id">Notification ID</param>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        await _notificationService.DeleteAsync(id);

        return Ok(ApiResponse<object>.Ok(
            null!,
            "Notification deleted."
        ));
    }

    // ── DELETE /api/notifications/all ─────────────────────────────
    /// <summary>
    /// Delete ALL notifications for the current user.
    /// </summary>
    [HttpDelete("all")]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    public async Task<IActionResult> DeleteAll()
    {
        await _notificationService.DeleteAllAsync();

        return Ok(ApiResponse<object>.Ok(
            null!,
            "All notifications deleted."
        ));
    }
}