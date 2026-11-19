using WorkHub.Application.DTOs.Chat;

namespace WorkHub.Application.Interfaces;

public interface IChatService
{
    Task<List<ChatRoomDto>> GetMyRoomsAsync(Guid userId, Guid orgId);
    Task<ChatRoomDto> GetRoomAsync(Guid roomId, Guid userId, Guid orgId);
    Task<ChatRoomDto> CreateRoomAsync(CreateRoomDto dto, Guid creatorId, Guid orgId);
    Task<ChatRoomDto> GetOrCreateDmAsync(Guid targetUserId, Guid currentUserId, Guid orgId);

    Task<MessagePageDto> GetMessagesAsync(
        Guid roomId,
        Guid userId,
        Guid orgId,
        string? cursor,
        int pageSize = 30);

    Task<MessageDto> SendMessageAsync(
        Guid roomId,
        SendMessageDto dto,
        Guid senderId,
        Guid orgId);

    Task<MessageDto> EditMessageAsync(
        Guid roomId,
        Guid messageId,
        EditMessageDto dto,
        Guid userId,
        Guid orgId);

    Task DeleteMessageAsync(Guid roomId, Guid messageId, Guid userId, Guid orgId);

    Task<ReactionGroupDto?> ToggleReactionAsync(
        Guid roomId,
        Guid messageId,
        ToggleReactionDto dto,
        Guid userId,
        Guid orgId);

    Task<List<ChatRoomMemberDto>> GetMembersAsync(Guid roomId, Guid userId, Guid orgId);
    Task AddMembersAsync(Guid roomId, AddMemberDto dto, Guid requesterId, Guid orgId);
    Task RemoveMemberAsync(Guid roomId, Guid targetUserId, Guid requesterId, Guid orgId);
    Task MarkRoomReadAsync(Guid roomId, Guid userId, Guid orgId);
}
