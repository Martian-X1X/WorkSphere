using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace WorkHub.API.Hubs;

/// <summary>
/// Real-time notification hub.
///
/// Every authenticated connection joins two groups:
///   - org:{orgId}   → everyone in the same organization
///   - user:{userId} → this user only (personal notifications)
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var orgId  = Context.User?.FindFirstValue("org_id");

        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(orgId))
        {
            _logger.LogWarning(
                "SignalR connection rejected — missing userId or orgId.");
            Context.Abort();
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"org:{orgId}");
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");

        _logger.LogInformation(
            "SignalR connected: User={UserId} Org={OrgId} ConnId={ConnId}",
            userId, orgId, Context.ConnectionId);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var orgId  = Context.User?.FindFirstValue("org_id");

        if (!string.IsNullOrWhiteSpace(orgId))
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"org:{orgId}");

        if (!string.IsNullOrWhiteSpace(userId))
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user:{userId}");

        _logger.LogInformation(
            "SignalR disconnected: User={UserId} ConnId={ConnId}",
            userId, Context.ConnectionId);

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Broadcasts a read receipt to the user's other tabs. Persistence is
    /// still handled by PATCH /api/notifications/{id}/read.
    /// </summary>
    public async Task MarkNotificationRead(string notificationId)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return;

        await Clients.Group($"user:{userId}")
            .SendAsync("NotificationRead", notificationId);
    }
}
