namespace WorkHub.Domain.Entities;

public class ChatRoomMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ChatRoomId { get; set; }
    public Guid UserId { get; set; }
    public Guid? LastReadMessageId { get; set; }
    public DateTime? LastReadAt { get; set; }
    public bool IsMuted { get; set; }
    public bool IsPinned { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public ChatRoom ChatRoom { get; set; } = null!;
    public User User { get; set; } = null!;
    public Message? LastReadMessage { get; set; }
}
