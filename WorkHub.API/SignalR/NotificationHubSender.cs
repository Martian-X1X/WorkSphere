using Microsoft.AspNetCore.SignalR;
using WorkHub.API.Hubs;
using WorkHub.Application.Interfaces;

namespace WorkHub.API.SignalR;

/// <summary>
/// SignalR-backed implementation of <see cref="INotificationHubSender"/>.
/// Lives in the API layer because it is the only project that references
/// the presentation hub.
/// </summary>
public class NotificationHubSender : INotificationHubSender
{
    private readonly IHubContext<NotificationHub> _hub;

    public NotificationHubSender(IHubContext<NotificationHub> hub)
    {
        _hub = hub;
    }

    public Task SendToUserAsync(string userId, string eventName, object payload)
        => _hub.Clients.Group($"user:{userId}").SendAsync(eventName, payload);

    public Task SendToOrgAsync(string orgId, string eventName, object payload)
        => _hub.Clients.Group($"org:{orgId}").SendAsync(eventName, payload);

    public Task SendUnreadCountAsync(string userId, int count)
        => _hub.Clients.Group($"user:{userId}")
            .SendAsync("UnreadCountChanged", count);
}
