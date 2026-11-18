using Microsoft.EntityFrameworkCore;
using WorkHub.Domain.Constants;
using WorkHub.Domain.Entities;
using WorkHub.Domain.Enums;

namespace WorkHub.Infrastructure.Data.Seeding;

public static class ChatSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        var orgs = await db.Organizations
            .Where(o => !o.IsDeleted)
            .ToListAsync();

        foreach (var org in orgs)
        {
            var alreadyExists = await db.ChatRooms.AnyAsync(r =>
                r.OrganizationId == org.Id &&
                r.Type == ChatRoomType.General);

            if (alreadyExists) continue;

            var members = await db.Users
                .Where(u => u.OrganizationId == org.Id && u.IsActive && !u.IsDeleted)
                .Select(u => u.Id)
                .ToListAsync();

            var creatorId = await db.Users
                .Where(u => u.OrganizationId == org.Id
                    && u.Role == UserRole.Owner
                    && u.IsActive
                    && !u.IsDeleted)
                .Select(u => u.Id)
                .FirstOrDefaultAsync();

            if (creatorId == Guid.Empty)
                creatorId = members.FirstOrDefault();

            if (creatorId == Guid.Empty) continue;

            var generalRoom = new ChatRoom
            {
                OrganizationId = org.Id,
                Name = "general",
                Description = "Company-wide announcements and conversation",
                Type = ChatRoomType.General,
                Icon = "💬",
                IsActive = true,
                CreatedByUserId = creatorId,
                CreatedAt = DateTime.UtcNow,
            };

            db.ChatRooms.Add(generalRoom);

            foreach (var userId in members)
            {
                db.ChatRoomMembers.Add(new ChatRoomMember
                {
                    ChatRoomId = generalRoom.Id,
                    UserId = userId,
                    JoinedAt = DateTime.UtcNow,
                    IsActive = true,
                });
            }

            db.Messages.Add(new Message
            {
                ChatRoomId = generalRoom.Id,
                OrganizationId = org.Id,
                SenderUserId = creatorId,
                Content = $"Welcome to **{org.Name}**! This is the beginning of your team's conversation.",
                Type = MessageType.System,
                CreatedAt = DateTime.UtcNow,
            });
        }

        await db.SaveChangesAsync();
    }
}
