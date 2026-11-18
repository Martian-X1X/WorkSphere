namespace WorkHub.Application.Interfaces;

/// <summary>
/// Sends real-time events to connected SignalR clients.
/// Implemented in the API layer so the Application layer stays free of
/// SignalR dependencies. Can be mocked in tests.
/// </summary>
public interface INotificationHubSender
{
    /// <summary>Send an event to a specific user (all their open tabs).</summary>
    Task SendToUserAsync(string userId, string eventName, object payload);

    /// <summary>Send an event to everyone in an organization.</summary>
    Task SendToOrgAsync(string orgId, string eventName, object payload);

    /// <summary>Notify a user that their unread count changed.</summary>
    Task SendUnreadCountAsync(string userId, int count);
}
