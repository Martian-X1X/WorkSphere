using WorkHub.Domain.Enums;

namespace WorkHub.Domain.Entities;

public class Message
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ChatRoomId { get; set; }
    public Guid OrganizationId { get; set; }
    public Guid SenderUserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public MessageType Type { get; set; } = MessageType.Text;
    public Guid? ParentMessageId { get; set; }
    public bool IsEdited { get; set; }
    public DateTime? EditedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ChatRoom ChatRoom { get; set; } = null!;
    public User Sender { get; set; } = null!;
    public Message? ParentMessage { get; set; }
    public ICollection<Message> Replies { get; set; } = new List<Message>();
    public ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();
    public ICollection<MessageAttachment> Attachments { get; set; } = new List<MessageAttachment>();
}
