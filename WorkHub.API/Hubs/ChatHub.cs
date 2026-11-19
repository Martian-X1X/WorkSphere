using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace WorkHub.API.Hubs;

/// <summary>
/// Real-time chat hub.
///
/// Connections join:
///   - org:{orgId}   → org-wide room preview / unread events
///   - user:{userId} → personal events across all tabs
///   - room:{roomId} → joined explicitly via JoinRoom when a room is opened
/// </summary>
[Authorize]
public class ChatHub : Hub
{
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(ILogger<ChatHub> logger)
    {
        _logger = logger;
    }

    // ── Connection lifecycle ───────────────────────────────────────────

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var orgId  = GetOrgId();

        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(orgId))
        {
            _logger.LogWarning(
                "[ChatHub] Connection rejected — missing userId or orgId.");
            Context.Abort();
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"org:{orgId}");
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");

        _logger.LogInformation(
            "[ChatHub] Connected: User={UserId} Org={OrgId} Conn={ConnId}",
            userId, orgId, Context.ConnectionId);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        var orgId  = GetOrgId();

        if (!string.IsNullOrWhiteSpace(orgId))
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"org:{orgId}");

        if (!string.IsNullOrWhiteSpace(userId))
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user:{userId}");

        _logger.LogInformation(
            "[ChatHub] Disconnected: User={UserId} Conn={ConnId}",
            userId, Context.ConnectionId);

        await base.OnDisconnectedAsync(exception);
    }

    // ── Client-callable methods ────────────────────────────────────────

    /// <summary>
    /// Client calls this after opening a chat room so it receives that
    /// room's real-time events.
    /// </summary>
    public async Task JoinRoom(string roomId)
    {
        if (string.IsNullOrWhiteSpace(roomId)) return;

        await Groups.AddToGroupAsync(Context.ConnectionId, $"room:{roomId}");

        _logger.LogDebug(
            "[ChatHub] User={UserId} joined room group room:{RoomId}",
            GetUserId(), roomId);
    }

    /// <summary>
    /// Client calls this when navigating away from a chat room.
    /// </summary>
    public async Task LeaveRoom(string roomId)
    {
        if (string.IsNullOrWhiteSpace(roomId)) return;

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"room:{roomId}");

        _logger.LogDebug(
            "[ChatHub] User={UserId} left room group room:{RoomId}",
            GetUserId(), roomId);
    }

    /// <summary>
    /// Client tells the server it has read all messages in a room.
    /// Persistence is handled by PATCH /api/chat/rooms/{id}/read; this
    /// echo keeps the user's other tabs in sync.
    /// </summary>
    public async Task MarkRead(string roomId)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return;

        await Clients
            .Group($"user:{userId}")
            .SendAsync("MarkRead", roomId);
    }

    // ── Typing indicators (prep for Day 75) ───────────────────────────

    public async Task StartTyping(string roomId)
    {
        var userId   = GetUserId();
        var userName = GetClaim("full_name", "FullName") ?? "Someone";

        await Clients
            .GroupExcept($"room:{roomId}", Context.ConnectionId)
            .SendAsync("UserTyping", new { roomId, userId, userName });
    }

    public async Task StopTyping(string roomId)
    {
        var userId = GetUserId();

        await Clients
            .GroupExcept($"room:{roomId}", Context.ConnectionId)
            .SendAsync("UserStoppedTyping", new { roomId, userId });
    }

    // ── Helpers ────────────────────────────────────────────────────────

    private string? GetUserId()
        => GetClaim(ClaimTypes.NameIdentifier, "sub");

    private string? GetOrgId()
        => GetClaim("org_id", "OrganizationId");

    /// <summary>
    /// Reads the first non-empty claim from the supplied aliases so the hub
    /// works with both the app's JWT claim names and conventional ones.
    /// </summary>
    private string? GetClaim(params string[] claimTypes)
    {
        foreach (var claimType in claimTypes)
        {
            var value = Context.User?.FindFirstValue(claimType);
            if (!string.IsNullOrWhiteSpace(value)) return value;
        }

        return null;
    }
}
