namespace WorkHub.Application.DTOs.Chat;

public class ChatRoomDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
    public Guid? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public string? Icon { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public string? LastMessagePreview { get; set; }
    public int UnreadCount { get; set; }
    public int MemberCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ChatRoomMemberDto> Members { get; set; } = new();
}

public class ChatRoomMemberDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsOnline { get; set; }
    public bool IsMuted { get; set; }
    public DateTime JoinedAt { get; set; }
}

public class CreateRoomDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string Type { get; set; } = "Custom";
    public List<Guid> MemberIds { get; set; } = new();
}

public class MessageDto
{
    public Guid Id { get; set; }
    public Guid ChatRoomId { get; set; }
    public Guid SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string? SenderAvatar { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Guid? ParentMessageId { get; set; }
    public bool IsEdited { get; set; }
    public DateTime? EditedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ReplyCount { get; set; }
    public List<ReactionGroupDto> Reactions { get; set; } = new();
    public List<MessageAttachmentDto> Attachments { get; set; } = new();
}

public class ReactionGroupDto
{
    public string Emoji { get; set; } = string.Empty;
    public int Count { get; set; }
    public bool IncludesMe { get; set; }
    public List<string> UserNames { get; set; } = new();
}

public class MessageAttachmentDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
}

public class SendMessageDto
{
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "Text";
    public Guid? ParentMessageId { get; set; }
}

public class EditMessageDto
{
    public string Content { get; set; } = string.Empty;
}

public class ToggleReactionDto
{
    public string Emoji { get; set; } = string.Empty;
}

public class AddMemberDto
{
    public List<Guid> UserIds { get; set; } = new();
}

public class MessagePageDto
{
    public List<MessageDto> Messages { get; set; } = new();
    public string? NextCursor { get; set; }
    public bool HasMore { get; set; }
}
