using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using WorkHub.Application.DTOs.Chat;
using WorkHub.Application.Interfaces;
using WorkHub.Domain.Constants;
using WorkHub.Domain.Entities;
using WorkHub.Domain.Enums;
using WorkHub.Domain.Exceptions;
using WorkHub.Infrastructure.Data;
using WorkHub.Infrastructure.Hubs;

namespace WorkHub.Application.Services;

public class ChatService : IChatService
{
    private readonly AppDbContext _db;
    private readonly IChatHubSender _hub;

    public ChatService(AppDbContext db, IChatHubSender hub)
    {
        _db = db;
        _hub = hub;
    }

    public async Task<List<ChatRoomDto>> GetMyRoomsAsync(Guid userId, Guid orgId)
    {
        var memberships = await _db.ChatRoomMembers
            .Where(m => m.UserId == userId
                     && m.IsActive
                     && m.ChatRoom.IsActive
                     && m.ChatRoom.OrganizationId == orgId)
            .Include(m => m.ChatRoom).ThenInclude(r => r.Project)
            .Include(m => m.ChatRoom)
                .ThenInclude(r => r.Members.Where(rm => rm.IsActive))
                    .ThenInclude(rm => rm.User)
            .OrderByDescending(m => m.ChatRoom.LastMessageAt ?? m.ChatRoom.CreatedAt)
            .ToListAsync();

        var result = new List<ChatRoomDto>();

        foreach (var membership in memberships)
        {
            var unreadCount = await GetUnreadCountAsync(membership.ChatRoomId, membership);
            result.Add(MapToRoomDto(membership.ChatRoom, membership, unreadCount));
        }

        return result;
    }

    public async Task<ChatRoomDto> GetRoomAsync(Guid roomId, Guid userId, Guid orgId)
    {
        var (room, membership) = await GetReadableRoomAsync(roomId, userId, orgId);
        var unreadCount = await GetUnreadCountAsync(roomId, membership);

        return MapToRoomDto(room, membership, unreadCount);
    }

    public async Task<ChatRoomDto> CreateRoomAsync(
        CreateRoomDto dto,
        Guid creatorId,
        Guid orgId)
    {
        if (!Enum.TryParse(dto.Type, true, out ChatRoomType roomType))
            roomType = ChatRoomType.Custom;

        if (roomType is ChatRoomType.General or ChatRoomType.Project)
            throw new BadRequestException("This room type cannot be created manually.");

        var name = string.IsNullOrWhiteSpace(dto.Name)
            ? null
            : dto.Name.Trim().ToLowerInvariant().Replace(' ', '-');

        if (name?.Length > 100)
            name = name[..100];

        var memberIds = (dto.MemberIds ?? new List<Guid>())
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        if (!memberIds.Contains(creatorId))
            memberIds.Insert(0, creatorId);

        var validUserIds = await _db.Users
            .Where(u => memberIds.Contains(u.Id)
                     && u.OrganizationId == orgId
                     && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

        if (!validUserIds.Contains(creatorId))
            throw new ForbiddenException("You are not a member of this organization.");

        if (roomType == ChatRoomType.Direct && validUserIds.Count != 2)
            throw new BadRequestException("A direct message requires exactly two active members.");

        var now = DateTime.UtcNow;
        var room = new ChatRoom
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Name = name,
            Description = string.IsNullOrWhiteSpace(dto.Description)
                ? null
                : dto.Description.Trim(),
            Type = roomType,
            Icon = "💬",
            IsActive = true,
            CreatedByUserId = creatorId,
            CreatedAt = now,
        };

        _db.ChatRooms.Add(room);

        foreach (var userId in validUserIds)
        {
            _db.ChatRoomMembers.Add(new ChatRoomMember
            {
                Id = Guid.NewGuid(),
                ChatRoomId = room.Id,
                UserId = userId,
                JoinedAt = now,
                IsActive = true,
            });
        }

        await _db.SaveChangesAsync();

        return await GetRoomAsync(room.Id, creatorId, orgId);
    }

    public async Task<ChatRoomDto> GetOrCreateDmAsync(
        Guid targetUserId,
        Guid currentUserId,
        Guid orgId)
    {
        if (targetUserId == currentUserId)
            throw new BadRequestException("Cannot DM yourself.");

        var targetExists = await _db.Users.AnyAsync(u =>
            u.Id == targetUserId
            && u.OrganizationId == orgId
            && u.IsActive);

        if (!targetExists)
            throw new NotFoundException("User", targetUserId);

        var existingDm = await _db.ChatRooms
            .Where(r => r.OrganizationId == orgId
                     && r.IsActive
                     && r.Type == ChatRoomType.Direct)
            .Where(r => r.Members.Any(m => m.UserId == currentUserId && m.IsActive)
                     && r.Members.Any(m => m.UserId == targetUserId && m.IsActive)
                     && r.Members.Count(m => m.IsActive) == 2)
            .Include(r => r.Project)
            .Include(r => r.Members.Where(m => m.IsActive)).ThenInclude(m => m.User)
            .FirstOrDefaultAsync();

        if (existingDm != null)
        {
            var membership = existingDm.Members.First(m => m.UserId == currentUserId);
            var unreadCount = await GetUnreadCountAsync(existingDm.Id, membership);

            return MapToRoomDto(existingDm, membership, unreadCount);
        }

        return await CreateRoomAsync(new CreateRoomDto
        {
            Type = nameof(ChatRoomType.Direct),
            MemberIds = new List<Guid> { currentUserId, targetUserId },
        }, currentUserId, orgId);
    }

    public async Task<MessagePageDto> GetMessagesAsync(
        Guid roomId,
        Guid userId,
        Guid orgId,
        string? cursor,
        int pageSize = 30)
    {
        await AssertMemberAsync(roomId, userId, orgId);

        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Messages
            .AsNoTracking()
            .Where(m => m.ChatRoomId == roomId && m.OrganizationId == orgId)
            .Include(m => m.Sender)
            .Include(m => m.Reactions).ThenInclude(r => r.User)
            .Include(m => m.Attachments)
            .Include(m => m.Replies.Where(r => !r.IsDeleted))
            .AsSplitQuery();

        if (!string.IsNullOrWhiteSpace(cursor))
        {
            var (cursorDate, cursorId) = DecodeCursor(cursor);
            var cursorKey = cursorId.ToString();

            query = query.Where(m =>
                m.CreatedAt < cursorDate
                || (m.CreatedAt == cursorDate && string.Compare(m.Id.ToString(), cursorKey) < 0));
        }

        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .ThenByDescending(m => m.Id.ToString())
            .Take(pageSize + 1)
            .ToListAsync();

        var hasMore = messages.Count > pageSize;
        var pageMessages = messages.Take(pageSize).ToList();

        string? nextCursor = null;
        if (hasMore && pageMessages.Count > 0)
        {
            var oldest = pageMessages[^1];
            nextCursor = EncodeCursor(oldest.CreatedAt, oldest.Id);
        }

        pageMessages.Reverse();

        return new MessagePageDto
        {
            Messages = pageMessages.Select(m => MapToMessageDto(m, userId)).ToList(),
            NextCursor = nextCursor,
            HasMore = hasMore,
        };
    }

    public async Task<MessageDto> SendMessageAsync(
        Guid roomId,
        SendMessageDto dto,
        Guid senderId,
        Guid orgId)
    {
        await AssertMemberAsync(roomId, senderId, orgId);

        var content = dto.Content?.Trim() ?? string.Empty;
        if (content.Length == 0)
            throw new BadRequestException("Message content is required.");

        if (content.Length > 4000)
            throw new BadRequestException("Message too long (max 4000 chars).");

        if (!Enum.TryParse(dto.Type, true, out MessageType messageType))
            messageType = MessageType.Text;

        if (messageType == MessageType.System)
            throw new BadRequestException("System messages cannot be sent manually.");

        if (dto.ParentMessageId.HasValue)
        {
            var parentExists = await _db.Messages.AnyAsync(m =>
                m.Id == dto.ParentMessageId.Value
                && m.ChatRoomId == roomId
                && m.OrganizationId == orgId
                && !m.IsDeleted);

            if (!parentExists)
                throw new BadRequestException("Parent message not found.");
        }

        var now = DateTime.UtcNow;
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ChatRoomId = roomId,
            OrganizationId = orgId,
            SenderUserId = senderId,
            Content = content,
            Type = messageType,
            ParentMessageId = dto.ParentMessageId,
            CreatedAt = now,
        };

        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        var preview = content.Length > 100 ? content[..100] + "…" : content;

        await _db.ChatRooms
            .Where(r => r.Id == roomId && r.OrganizationId == orgId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(r => r.LastMessageAt, now)
                .SetProperty(r => r.LastMessagePreview, preview));

        var saved = await _db.Messages
            .Include(m => m.Sender)
            .Include(m => m.Reactions).ThenInclude(r => r.User)
            .Include(m => m.Attachments)
            .Include(m => m.Replies.Where(r => !r.IsDeleted))
            .AsSplitQuery()
            .FirstAsync(m => m.Id == message.Id);

        var messageDto = MapToMessageDto(saved, senderId);

        // Real-time: new message to all members currently in the room group.
        await _hub.SendToRoomAsync(
            roomId.ToString(),
            ChatHubEvents.NewMessage,
            messageDto);

        // Room preview + unread badge updates for the whole org.
        await _hub.SendToOrgAsync(
            orgId.ToString(),
            ChatHubEvents.RoomUpdated,
            new
            {
                roomId,
                lastMessageAt      = messageDto.CreatedAt,
                lastMessagePreview = messageDto.Content.Length > 100
                    ? messageDto.Content[..100] + "…"
                    : messageDto.Content,
            });

        return messageDto;
    }

    public async Task<MessageDto> EditMessageAsync(
        Guid roomId,
        Guid messageId,
        EditMessageDto dto,
        Guid userId,
        Guid orgId)
    {
        await AssertMemberAsync(roomId, userId, orgId);

        var content = dto.Content?.Trim() ?? string.Empty;
        if (content.Length == 0)
            throw new BadRequestException("Content is required.");

        if (content.Length > 4000)
            throw new BadRequestException("Message too long (max 4000 chars).");

        var message = await _db.Messages
            .Include(m => m.Sender)
            .Include(m => m.Reactions).ThenInclude(r => r.User)
            .Include(m => m.Attachments)
            .Include(m => m.Replies.Where(r => !r.IsDeleted))
            .AsSplitQuery()
            .FirstOrDefaultAsync(m => m.Id == messageId
                                   && m.ChatRoomId == roomId
                                   && m.OrganizationId == orgId
                                   && !m.IsDeleted)
            ?? throw new NotFoundException("Message", messageId);

        if (message.SenderUserId != userId)
            throw new ForbiddenException("You can only edit your own messages.");

        if (message.Type == MessageType.System)
            throw new BadRequestException("System messages cannot be edited.");

        message.Content = content;
        message.IsEdited = true;
        message.EditedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var editedDto = MapToMessageDto(message, userId);

        await _hub.SendToRoomAsync(
            roomId.ToString(),
            ChatHubEvents.MessageEdited,
            editedDto);

        return editedDto;
    }

    public async Task DeleteMessageAsync(
        Guid roomId,
        Guid messageId,
        Guid userId,
        Guid orgId)
    {
        await AssertMemberAsync(roomId, userId, orgId);

        var message = await _db.Messages
            .FirstOrDefaultAsync(m => m.Id == messageId
                                   && m.ChatRoomId == roomId
                                   && m.OrganizationId == orgId
                                   && !m.IsDeleted)
            ?? throw new NotFoundException("Message", messageId);

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId
                                   && u.OrganizationId == orgId
                                   && u.IsActive)
            ?? throw new ForbiddenException("You are not a member of this organization.");

        var canDelete = message.SenderUserId == userId
                     || user.Role == UserRole.Owner
                     || user.Role == UserRole.Admin;

        if (!canDelete)
            throw new ForbiddenException("You cannot delete this message.");

        message.IsDeleted = true;
        message.DeletedAt = DateTime.UtcNow;
        message.DeletedByUserId = userId;
        message.Content = "[message deleted]";

        await _db.SaveChangesAsync();

        await _hub.SendToRoomAsync(
            roomId.ToString(),
            ChatHubEvents.MessageDeleted,
            new { messageId, chatRoomId = roomId });
    }

    public async Task<ReactionGroupDto?> ToggleReactionAsync(
        Guid roomId,
        Guid messageId,
        ToggleReactionDto dto,
        Guid userId,
        Guid orgId)
    {
        await AssertMemberAsync(roomId, userId, orgId);

        var emoji = dto.Emoji?.Trim() ?? string.Empty;
        if (emoji.Length == 0)
            throw new BadRequestException("Emoji is required.");

        if (emoji.Length > 10)
            throw new BadRequestException("Emoji cannot exceed 10 characters.");

        var messageExists = await _db.Messages.AnyAsync(m =>
            m.Id == messageId
            && m.ChatRoomId == roomId
            && m.OrganizationId == orgId
            && !m.IsDeleted);

        if (!messageExists)
            throw new NotFoundException("Message", messageId);

        var existing = await _db.MessageReactions
            .FirstOrDefaultAsync(r => r.MessageId == messageId
                                   && r.UserId == userId
                                   && r.Emoji == emoji);

        if (existing != null)
        {
            _db.MessageReactions.Remove(existing);
        }
        else
        {
            _db.MessageReactions.Add(new MessageReaction
            {
                Id = Guid.NewGuid(),
                MessageId = messageId,
                UserId = userId,
                Emoji = emoji,
                CreatedAt = DateTime.UtcNow,
            });
        }

        await _db.SaveChangesAsync();

        var reactions = await _db.MessageReactions
            .AsNoTracking()
            .Include(r => r.User)
            .Where(r => r.MessageId == messageId && r.Emoji == emoji)
            .ToListAsync();

        ReactionGroupDto? group = reactions.Count == 0
            ? null
            : new ReactionGroupDto
            {
                Emoji = emoji,
                Count = reactions.Count,
                IncludesMe = reactions.Any(r => r.UserId == userId),
                UserNames = reactions
                    .Select(r => $"{r.User.FirstName} {r.User.LastName}")
                    .ToList(),
            };

        // Include user ids so each client can compute its own "IncludesMe"
        // flag instead of inheriting the acting user's state.
        await _hub.SendToRoomAsync(
            roomId.ToString(),
            ChatHubEvents.ReactionUpdated,
            new
            {
                messageId,
                emoji,
                group,
                userIds = reactions.Select(r => r.UserId).ToList(),
            });

        return group;
    }

    public async Task<List<ChatRoomMemberDto>> GetMembersAsync(
        Guid roomId,
        Guid userId,
        Guid orgId)
    {
        await AssertMemberAsync(roomId, userId, orgId);

        return await _db.ChatRoomMembers
            .AsNoTracking()
            .Where(m => m.ChatRoomId == roomId && m.IsActive)
            .Include(m => m.User)
            .OrderBy(m => m.User.FirstName)
            .Select(m => new ChatRoomMemberDto
            {
                UserId = m.UserId,
                FullName = m.User.FirstName + " " + m.User.LastName,
                AvatarUrl = m.User.ProfilePictureUrl,
                Role = m.User.Role,
                IsMuted = m.IsMuted,
                JoinedAt = m.JoinedAt,
            })
            .ToListAsync();
    }

    public async Task AddMembersAsync(
        Guid roomId,
        AddMemberDto dto,
        Guid requesterId,
        Guid orgId)
    {
        await AssertMemberAsync(roomId, requesterId, orgId);

        var room = await _db.ChatRooms
            .FirstOrDefaultAsync(r => r.Id == roomId
                                   && r.OrganizationId == orgId
                                   && r.IsActive)
            ?? throw new ForbiddenException("You are not a member of this room.");

        if (room.Type == ChatRoomType.Direct)
            throw new BadRequestException("Cannot add members to a DM.");

        var userIds = (dto.UserIds ?? new List<Guid>())
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        if (userIds.Count == 0)
            throw new BadRequestException("At least one user is required.");

        var validUserIds = await _db.Users
            .Where(u => userIds.Contains(u.Id)
                     && u.OrganizationId == orgId
                     && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

        if (validUserIds.Count != userIds.Count)
            throw new BadRequestException("One or more users are not available in this organization.");

        var existingMemberships = await _db.ChatRoomMembers
            .Where(m => m.ChatRoomId == roomId && userIds.Contains(m.UserId))
            .ToListAsync();

        var now = DateTime.UtcNow;

        foreach (var userId in validUserIds)
        {
            var membership = existingMemberships.FirstOrDefault(m => m.UserId == userId);

            if (membership != null)
            {
                if (!membership.IsActive)
                {
                    membership.IsActive = true;
                    membership.JoinedAt = now;
                }

                continue;
            }

            _db.ChatRoomMembers.Add(new ChatRoomMember
            {
                Id = Guid.NewGuid(),
                ChatRoomId = roomId,
                UserId = userId,
                JoinedAt = now,
                IsActive = true,
            });
        }

        await _db.SaveChangesAsync();

        foreach (var id in validUserIds)
        {
            await _hub.SendToUserAsync(
                id.ToString(),
                ChatHubEvents.MemberJoined,
                new { roomId });
        }
    }

    public async Task RemoveMemberAsync(
        Guid roomId,
        Guid targetUserId,
        Guid requesterId,
        Guid orgId)
    {
        var room = await _db.ChatRooms
            .FirstOrDefaultAsync(r => r.Id == roomId
                                   && r.OrganizationId == orgId
                                   && r.IsActive)
            ?? throw new ForbiddenException("You are not a member of this room.");

        if (room.Type == ChatRoomType.General)
            throw new BadRequestException("Cannot leave the General room.");

        if (room.Type == ChatRoomType.Direct)
            throw new BadRequestException("Cannot remove members from a DM.");

        var requester = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == requesterId
                                   && u.OrganizationId == orgId
                                   && u.IsActive)
            ?? throw new ForbiddenException("You are not a member of this organization.");

        if (targetUserId != requesterId
            && requester.Role != UserRole.Owner
            && requester.Role != UserRole.Admin)
            throw new ForbiddenException("Only admins can remove other members.");

        var membership = await _db.ChatRoomMembers
            .FirstOrDefaultAsync(m => m.ChatRoomId == roomId
                                   && m.UserId == targetUserId
                                   && m.IsActive)
            ?? throw new NotFoundException("Member", targetUserId);

        membership.IsActive = false;
        await _db.SaveChangesAsync();

        await _hub.SendToRoomAsync(
            roomId.ToString(),
            ChatHubEvents.MemberLeft,
            new { roomId, userId = targetUserId });
    }

    public async Task MarkRoomReadAsync(Guid roomId, Guid userId, Guid orgId)
    {
        await AssertMemberAsync(roomId, userId, orgId);

        var latestMessageId = await _db.Messages
            .Where(m => m.ChatRoomId == roomId
                     && m.OrganizationId == orgId
                     && !m.IsDeleted)
            .OrderByDescending(m => m.CreatedAt)
            .ThenByDescending(m => m.Id.ToString())
            .Select(m => m.Id)
            .FirstOrDefaultAsync();

        if (latestMessageId == default)
            return;

        await _db.ChatRoomMembers
            .Where(m => m.ChatRoomId == roomId
                     && m.UserId == userId
                     && m.IsActive)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(m => m.LastReadMessageId, latestMessageId)
                .SetProperty(m => m.LastReadAt, DateTime.UtcNow));
    }

    private async Task AssertMemberAsync(Guid roomId, Guid userId, Guid orgId)
    {
        var isMember = await _db.ChatRoomMembers.AnyAsync(m =>
            m.ChatRoomId == roomId
            && m.UserId == userId
            && m.IsActive
            && m.ChatRoom.IsActive
            && m.ChatRoom.OrganizationId == orgId);

        if (!isMember)
            throw new ForbiddenException("You are not a member of this room.");
    }

    private async Task<(ChatRoom Room, ChatRoomMember Membership)> GetReadableRoomAsync(
        Guid roomId,
        Guid userId,
        Guid orgId)
    {
        var room = await _db.ChatRooms
            .Include(r => r.Project)
            .Include(r => r.Members.Where(m => m.IsActive)).ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r => r.Id == roomId
                                   && r.OrganizationId == orgId
                                   && r.IsActive)
            ?? throw new ForbiddenException("You are not a member of this room.");

        var membership = room.Members.FirstOrDefault(m => m.UserId == userId && m.IsActive)
            ?? throw new ForbiddenException("You are not a member of this room.");

        return (room, membership);
    }

    private async Task<int> GetUnreadCountAsync(Guid roomId, ChatRoomMember membership)
    {
        if (!membership.LastReadMessageId.HasValue)
        {
            return await _db.Messages.CountAsync(m =>
                m.ChatRoomId == roomId && !m.IsDeleted);
        }

        var lastRead = await _db.Messages
            .AsNoTracking()
            .Where(m => m.Id == membership.LastReadMessageId.Value
                     && m.ChatRoomId == roomId)
            .Select(m => new { m.CreatedAt, m.Id })
            .FirstOrDefaultAsync();

        if (lastRead == null)
        {
            return await _db.Messages.CountAsync(m =>
                m.ChatRoomId == roomId && !m.IsDeleted);
        }

        var lastReadKey = lastRead.Id.ToString();

        return await _db.Messages.CountAsync(m =>
            m.ChatRoomId == roomId
            && !m.IsDeleted
            && (m.CreatedAt > lastRead.CreatedAt
                || (m.CreatedAt == lastRead.CreatedAt
                    && string.Compare(m.Id.ToString(), lastReadKey) > 0)));
    }

    private static ChatRoomDto MapToRoomDto(
        ChatRoom room,
        ChatRoomMember membership,
        int unreadCount)
    {
        return new ChatRoomDto
        {
            Id = room.Id,
            Name = room.Name,
            Description = room.Description,
            Type = room.Type.ToString(),
            ProjectId = room.ProjectId,
            ProjectName = room.Project?.Name,
            Icon = room.Icon,
            IsActive = room.IsActive,
            LastMessageAt = room.LastMessageAt,
            LastMessagePreview = room.LastMessagePreview,
            UnreadCount = unreadCount,
            MemberCount = room.Members.Count(m => m.IsActive),
            CreatedAt = room.CreatedAt,
            Members = room.Members
                .Where(m => m.IsActive)
                .Select(m => new ChatRoomMemberDto
                {
                    UserId = m.UserId,
                    FullName = $"{m.User.FirstName} {m.User.LastName}",
                    AvatarUrl = m.User.ProfilePictureUrl,
                    Role = m.User.Role,
                    IsMuted = m.IsMuted,
                    JoinedAt = m.JoinedAt,
                })
                .ToList(),
        };
    }

    private static MessageDto MapToMessageDto(Message message, Guid currentUserId)
    {
        var reactions = message.Reactions
            .GroupBy(r => r.Emoji)
            .Select(group => new ReactionGroupDto
            {
                Emoji = group.Key,
                Count = group.Count(),
                IncludesMe = group.Any(r => r.UserId == currentUserId),
                UserNames = group
                    .Select(r => $"{r.User.FirstName} {r.User.LastName}")
                    .ToList(),
            })
            .ToList();

        return new MessageDto
        {
            Id = message.Id,
            ChatRoomId = message.ChatRoomId,
            SenderUserId = message.SenderUserId,
            SenderName = $"{message.Sender.FirstName} {message.Sender.LastName}",
            SenderAvatar = message.Sender.ProfilePictureUrl,
            Content = message.Content,
            Type = message.Type.ToString(),
            ParentMessageId = message.ParentMessageId,
            IsEdited = message.IsEdited,
            EditedAt = message.EditedAt,
            IsDeleted = message.IsDeleted,
            CreatedAt = message.CreatedAt,
            ReplyCount = message.Replies?.Count(r => !r.IsDeleted) ?? 0,
            Reactions = reactions,
            Attachments = message.Attachments?.Select(a => new MessageAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                ContentType = a.ContentType,
                FileSizeBytes = a.FileSizeBytes,
            }).ToList() ?? new List<MessageAttachmentDto>(),
        };
    }

    private static string EncodeCursor(DateTime createdAt, Guid id)
    {
        var utc = createdAt.Kind switch
        {
            DateTimeKind.Utc => createdAt,
            DateTimeKind.Local => createdAt.ToUniversalTime(),
            _ => DateTime.SpecifyKind(createdAt, DateTimeKind.Utc),
        };

        var raw = $"{utc:O}|{id}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(raw));
    }

    private static (DateTime CreatedAt, Guid Id) DecodeCursor(string cursor)
    {
        try
        {
            var raw = Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
            var parts = raw.Split('|');

            if (parts.Length != 2)
                throw new FormatException("Malformed cursor.");

            var createdAt = DateTime.Parse(
                parts[0],
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind);

            if (createdAt.Kind == DateTimeKind.Unspecified)
                createdAt = DateTime.SpecifyKind(createdAt, DateTimeKind.Utc);

            return (createdAt.ToUniversalTime(), Guid.Parse(parts[1]));
        }
        catch
        {
            throw new BadRequestException("Invalid pagination cursor.");
        }
    }
}
