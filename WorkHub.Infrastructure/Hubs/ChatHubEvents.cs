namespace WorkHub.Infrastructure.Hubs;

/// <summary>
/// All SignalR event names for the chat system.
/// Shared constants prevent typos between server and client.
/// </summary>
public static class ChatHubEvents
{
    // Server -> Client (what the server pushes to browsers)
    public const string NewMessage        = "NewMessage";
    public const string MessageEdited     = "MessageEdited";
    public const string MessageDeleted    = "MessageDeleted";
    public const string ReactionUpdated   = "ReactionUpdated";
    public const string MemberJoined      = "MemberJoined";
    public const string MemberLeft        = "MemberLeft";
    public const string RoomUpdated       = "RoomUpdated";
    public const string UserTyping        = "UserTyping";       // Day 75
    public const string UserStoppedTyping = "UserStoppedTyping"; // Day 75

    // Client -> Server (what browsers call on the hub)
    public const string JoinRoom          = "JoinRoom";
    public const string LeaveRoom         = "LeaveRoom";
    public const string StartTyping       = "StartTyping";      // Day 75
    public const string StopTyping        = "StopTyping";       // Day 75
    public const string MarkRead          = "MarkRead";
}
