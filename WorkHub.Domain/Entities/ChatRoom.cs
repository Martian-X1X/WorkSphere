using WorkHub.Domain.Enums;

namespace WorkHub.Domain.Entities;

public class ChatRoom
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public ChatRoomType Type { get; set; }
    public Guid? ProjectId { get; set; }
    public string? Icon { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastMessageAt { get; set; }
    public string? LastMessagePreview { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedByUserId { get; set; }

    public Organization Organization { get; set; } = null!;
    public Project? Project { get; set; }
    public User CreatedBy { get; set; } = null!;
    public ICollection<ChatRoomMember> Members { get; set; } = new List<ChatRoomMember>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
