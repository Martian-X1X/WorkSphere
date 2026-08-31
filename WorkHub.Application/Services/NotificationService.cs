using System.Text.Json;
using WorkHub.Infrastructure.Data;
using WorkHub.Application.DTOs.Notifications;
using WorkHub.Application.Interfaces;
using WorkHub.Domain.Entities;

namespace WorkHub.Application.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext        _context;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        AppDbContext        context,
        ICurrentUserService currentUser,
        ILogger<NotificationService> logger)
    {
        _context     = context;
        _currentUser = currentUser;
        _logger      = logger;
    }

    // ── Create single notification ─────────────────────────────────
    public async Task CreateAsync(CreateNotificationDto dto)
    {
        try
        {
            var notification = new Notification
            {
                UserId          = dto.UserId,
                OrganizationId  = dto.OrganizationId,
                Type            = dto.Type,
                Title           = dto.Title,
                Message         = dto.Message,
                EntityType      = dto.EntityType,
                EntityId        = dto.EntityId,
                ActionUrl       = dto.ActionUrl,
                CreatedByUserId = dto.CreatedByUserId,
                CreatedByName   = dto.CreatedByName,
                Metadata        = dto.Metadata,
                IsRead          = false,
                CreatedAt       = DateTime.UtcNow,
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            _logger.LogDebug(
                "Notification created for user {UserId}: {Type}",
                dto.UserId, dto.Type);
        }
        catch (Exception ex)
        {
            // Never throw — notifications failing should not break features
            _logger.LogError(ex,
                "Failed to create notification for user {UserId}: {Type}",
                dto.UserId, dto.Type);
        }
    }

    // ── Create for multiple users ──────────────────────────────────
    public async Task CreateForUsersAsync(
        IEnumerable<Guid>    userIds,
        CreateNotificationDto template)
    {
        try
        {
            var now           = DateTime.UtcNow;
            var notifications = userIds.Select(userId => new Notification
            {
                UserId          = userId,
                OrganizationId  = template.OrganizationId,
                Type            = template.Type,
                Title           = template.Title,
                Message         = template.Message,
                EntityType      = template.EntityType,
                EntityId        = template.EntityId,
                ActionUrl       = template.ActionUrl,
                CreatedByUserId = template.CreatedByUserId,
                CreatedByName   = template.CreatedByName,
                Metadata        = template.Metadata,
                IsRead          = false,
                CreatedAt       = now,
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();

            _logger.LogDebug(
                "Bulk notifications created for {Count} users: {Type}",
                notifications.Count, template.Type);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to create bulk notifications: {Type}", template.Type);
        }
    }

    // ── Get feed ───────────────────────────────────────────────────
    public async Task<NotificationFeedDto> GetFeedAsync(
        int  page       = 1,
        int  pageSize   = 20,
        bool unreadOnly = false)
    {
        var userId = _currentUser.UserId;
        var orgId  = _currentUser.OrganizationId;

        var query = _context.Notifications
            .Where(n =>
                n.UserId         == userId &&
                n.OrganizationId == orgId)
            .AsQueryable();

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        var totalCount   = await query.CountAsync();
        var unreadCount  = unreadOnly
            ? totalCount
            : await _context.Notifications.CountAsync(n =>
                n.UserId == userId &&
                n.OrganizationId == orgId &&
                !n.IsRead);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto
            {
                Id            = n.Id,
                Type          = n.Type,
                Title         = n.Title,
                Message       = n.Message,
                EntityType    = n.EntityType,
                EntityId      = n.EntityId,
                ActionUrl     = n.ActionUrl,
                CreatedByName = n.CreatedByName,
                IsRead        = n.IsRead,
                ReadAt        = n.ReadAt,
                CreatedAt     = n.CreatedAt,
                Metadata      = n.Metadata,
            })
            .ToListAsync();

        return new NotificationFeedDto
        {
            Items       = items,
            UnreadCount = unreadCount,
            TotalCount  = totalCount,
            HasMore     = (page * pageSize) < totalCount,
        };
    }

    // ── Get count ──────────────────────────────────────────────────
    public async Task<NotificationCountDto> GetCountAsync()
    {
        var userId = _currentUser.UserId;
        var orgId  = _currentUser.OrganizationId;

        var total  = await _context.Notifications
            .CountAsync(n =>
                n.UserId         == userId &&
                n.OrganizationId == orgId);

        var unread = await _context.Notifications
            .CountAsync(n =>
                n.UserId         == userId &&
                n.OrganizationId == orgId  &&
                !n.IsRead);

        return new NotificationCountDto
        {
            UnreadCount = unread,
            TotalCount  = total,
        };
    }

    // ── Mark as read ───────────────────────────────────────────────
    public async Task MarkAsReadAsync(Guid notificationId)
    {
        var userId = _currentUser.UserId;

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n =>
                n.Id     == notificationId &&
                n.UserId == userId)
            ?? throw new KeyNotFoundException("Notification not found.");

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    // ── Mark all as read ───────────────────────────────────────────
    public async Task MarkAllAsReadAsync()
    {
        var userId = _currentUser.UserId;
        var orgId  = _currentUser.OrganizationId;
        var now    = DateTime.UtcNow;

        await _context.Notifications
            .Where(n =>
                n.UserId         == userId &&
                n.OrganizationId == orgId  &&
                !n.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAt, now)
            );
    }

    // ── Delete ─────────────────────────────────────────────────────
    public async Task DeleteAsync(Guid notificationId)
    {
        var userId = _currentUser.UserId;

        await _context.Notifications
            .Where(n =>
                n.Id     == notificationId &&
                n.UserId == userId)
            .ExecuteDeleteAsync();
    }

    // ── Domain helpers ─────────────────────────────────────────────

    public async Task NotifyTaskAssignedAsync(
        Guid   assigneeUserId,
        Guid   organizationId,
        string taskTitle,
        Guid   taskId,
        string projectName,
        Guid   assignedByUserId,
        string assignedByName)
    {
        // Don't notify if you assigned yourself
        if (assigneeUserId == assignedByUserId) return;

        await CreateAsync(new CreateNotificationDto
        {
            UserId          = assigneeUserId,
            OrganizationId  = organizationId,
            Type            = NotificationTypes.TaskAssigned,
            Title           = "New task assigned to you",
            Message         = $"{assignedByName} assigned you to \"{taskTitle}\"",
            EntityType      = NotificationEntityTypes.Task,
            EntityId        = taskId,
            ActionUrl       = $"/tasks/{taskId}",
            CreatedByUserId = assignedByUserId,
            CreatedByName   = assignedByName,
            Metadata        = JsonSerializer.Serialize(new
            {
                projectName,
                taskTitle,
            }),
        });
    }

    public async Task NotifyCommentAddedAsync(
        Guid   taskOwnerId,
        Guid   organizationId,
        string taskTitle,
        Guid   taskId,
        string commenterName,
        Guid   commenterUserId)
    {
        // Don't notify if you commented on your own task
        if (taskOwnerId == commenterUserId) return;

        await CreateAsync(new CreateNotificationDto
        {
            UserId          = taskOwnerId,
            OrganizationId  = organizationId,
            Type            = NotificationTypes.CommentAdded,
            Title           = "New comment on your task",
            Message         = $"{commenterName} commented on \"{taskTitle}\"",
            EntityType      = NotificationEntityTypes.Task,
            EntityId        = taskId,
            ActionUrl       = $"/tasks/{taskId}",
            CreatedByUserId = commenterUserId,
            CreatedByName   = commenterName,
            Metadata        = JsonSerializer.Serialize(new { taskTitle }),
        });
    }

    public async Task NotifyMemberJoinedAsync(
        Guid   organizationId,
        string newMemberName,
        Guid   newMemberId,
        string role)
    {
        // Notify all Owner + Admin members
        var adminUserIds = await _context.Users
            .Where(u =>
                u.OrganizationId == organizationId &&
                u.IsActive       == true           &&
                u.Id             != newMemberId    &&
                (u.Role == UserRole.Owner || u.Role == UserRole.Admin))
            .Select(u => u.Id)
            .ToListAsync();

        if (adminUserIds.Count == 0) return;

        await CreateForUsersAsync(adminUserIds, new CreateNotificationDto
        {
            OrganizationId  = organizationId,
            Type            = NotificationTypes.MemberJoined,
            Title           = "New team member joined",
            Message         = $"{newMemberName} joined as {role}",
            EntityType      = NotificationEntityTypes.Member,
            EntityId        = newMemberId,
            ActionUrl       = "/members",
            CreatedByUserId = newMemberId,
            CreatedByName   = newMemberName,
            Metadata        = JsonSerializer.Serialize(new
            {
                role,
                memberName = newMemberName,
            }),
        });
    }

    public async Task NotifyInviteAcceptedAsync(
        Guid   inviterUserId,
        Guid   organizationId,
        string newMemberName,
        string newMemberEmail)
    {
        await CreateAsync(new CreateNotificationDto
        {
            UserId          = inviterUserId,
            OrganizationId  = organizationId,
            Type            = NotificationTypes.InviteAccepted,
            Title           = "Your invite was accepted",
            Message         = $"{newMemberName} ({newMemberEmail}) accepted your invite",
            EntityType      = NotificationEntityTypes.Member,
            ActionUrl       = "/members",
            CreatedByName   = newMemberName,
            Metadata        = JsonSerializer.Serialize(new
            {
                memberName  = newMemberName,
                memberEmail = newMemberEmail,
            }),
        });
    }

    public async Task NotifyProjectCreatedAsync(
        Guid   organizationId,
        string projectName,
        Guid   projectId,
        Guid   createdByUserId,
        string createdByName)
    {
        // Notify all members EXCEPT the creator
        var memberIds = await _context.Users
            .Where(u =>
                u.OrganizationId == organizationId &&
                u.IsActive       == true           &&
                u.Id             != createdByUserId)
            .Select(u => u.Id)
            .ToListAsync();

        if (memberIds.Count == 0) return;

        await CreateForUsersAsync(memberIds, new CreateNotificationDto
        {
            OrganizationId  = organizationId,
            Type            = NotificationTypes.ProjectCreated,
            Title           = "New project created",
            Message         = $"{createdByName} created project \"{projectName}\"",
            EntityType      = NotificationEntityTypes.Project,
            EntityId        = projectId,
            ActionUrl       = $"/projects/{projectId}",
            CreatedByUserId = createdByUserId,
            CreatedByName   = createdByName,
            Metadata        = JsonSerializer.Serialize(new { projectName }),
        });
    }
}
