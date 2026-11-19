namespace WorkHub.Application.Interfaces;

/// <summary>
/// Sends real-time chat events to connected SignalR clients.
/// Implemented in Infrastructure; injected into ChatService.
/// </summary>
public interface IChatHubSender
{
    /// <summary>Send an event to everyone in a chat room group.</summary>
    Task SendToRoomAsync(string roomId, string eventName, object payload);

    /// <summary>Send an event to a specific user (all their tabs).</summary>
    Task SendToUserAsync(string userId, string eventName, object payload);

    /// <summary>Send an event to everyone in the org.</summary>
    Task SendToOrgAsync(string orgId, string eventName, object payload);
}
