using Microsoft.AspNetCore.SignalR;
using WorkHub.API.Hubs;
using WorkHub.Application.Interfaces;

namespace WorkHub.API.SignalR;

/// <summary>
/// SignalR-backed implementation of <see cref="IChatHubSender"/>.
/// Lives in the API layer because it is the only project that references
/// the presentation hub.
/// </summary>
public class ChatHubSender : IChatHubSender
{
    private readonly IHubContext<ChatHub> _hub;

    public ChatHubSender(IHubContext<ChatHub> hub)
    {
        _hub = hub;
    }

    public Task SendToRoomAsync(string roomId, string eventName, object payload)
        => _hub.Clients.Group($"room:{roomId}").SendAsync(eventName, payload);

    public Task SendToUserAsync(string userId, string eventName, object payload)
        => _hub.Clients.Group($"user:{userId}").SendAsync(eventName, payload);

    public Task SendToOrgAsync(string orgId, string eventName, object payload)
        => _hub.Clients.Group($"org:{orgId}").SendAsync(eventName, payload);
}
