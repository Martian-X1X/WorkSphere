using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using WorkHub.Infrastructure.Data;
using WorkHub.Infrastructure.Services;
using WorkHub.Application.DTOs.Notifications;
using WorkHub.Application.Interfaces;
using WorkHub.Domain.Constants;
using WorkHub.Domain.Entities;
using WorkHub.Domain.Exceptions;

namespace WorkHub.Application.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext        _context;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<NotificationService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ICacheService       _cache;
    private readonly INotificationHubSender _hubSender;

    private static readonly TimeSpan CountCacheDuration =
        TimeSpan.FromSeconds(AppConstants.NotificationCountCacheSeconds);

    public NotificationService(
        AppDbContext             context,
        ICurrentUserService      currentUser,
        ILogger<NotificationService> logger,
        IServiceScopeFactory     scopeFactory,
        ICacheService            cache,
        INotificationHubSender   hubSender)
    {
        _context      = context;
        _currentUser  = currentUser;
        _logger       = logger;
        _scopeFactory = scopeFactory;
        _cache        = cache;
        _hubSender    = hubSender;
    }

    // ── Real-time helpers ────────────────────────────────────────────

    private static NotificationDto MapToDto(Notification n) => new()
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
    };

    /// <summary>
    /// Pushes a newly created notification + fresh unread count to the
    /// recipient. Never throws — real-time delivery is best-effort.
    /// </summary>
    private async Task PushNewNotificationAsync(
        AppDbContext            context,
        Notification            notification,
        INotificationHubSender  hubSender)
    {
        try
        {
            var userId = notification.UserId.ToString();

            await hubSender.SendToUserAsync(
                userId, "NewNotification", MapToDto(notification));

            var unread = await context.Notifications.CountAsync(n =>
                n.UserId         == notification.UserId &&
                n.OrganizationId == notification.OrganizationId &&
                !n.IsRead);

            await hubSender.SendUnreadCountAsync(userId, unread);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to push real-time notification to user {UserId}",
                notification.UserId);
        }
    }

    /// <summary>Pushes the current unread count to a user. Best-effort.</summary>
    private async Task PushUnreadCountAsync(
        Guid             userId,
        Guid             organizationId,
        INotificationHubSender hubSender)
    {
        try
        {
            var unread = await _context.Notifications.CountAsync(n =>
                n.UserId         == userId &&
                n.OrganizationId == organizationId &&
                !n.IsRead);

            await hubSender.SendUnreadCountAsync(userId.ToString(), unread);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to push unread count to user {UserId}", userId);
        }
    }

    // ── Fire-and-forget safe create ─────────────────────────────────
    // Creates its own DI scope so it works after the HTTP request ends.
    private void CreateInBackground(CreateNotificationDto dto)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context     = scope.ServiceProvider
                                       .GetRequiredService<AppDbContext>();

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

                context.Notifications.Add(notification);
                await context.SaveChangesAsync();

                InvalidateCountCache(dto.UserId);

                var hubSender = scope.ServiceProvider
                                     .GetRequiredService<INotificationHubSender>();
                await PushNewNotificationAsync(context, notification, hubSender);

                _logger.LogDebug(
                    "Background notification saved for user {UserId}: {Type}",
                    dto.UserId, dto.Type);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Background notification failed for user {UserId}: {Type}",
                    dto.UserId, dto.Type);
            }
        });
    }

    private void CreateManyInBackground(
        IEnumerable<Guid>     userIds,
        CreateNotificationDto template)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context     = scope.ServiceProvider
                                       .GetRequiredService<AppDbContext>();

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

                context.Notifications.AddRange(notifications);
                await context.SaveChangesAsync();

                foreach (var userId in userIds)
                    InvalidateCountCache(userId);

                var hubSender = scope.ServiceProvider
                                     .GetRequiredService<INotificationHubSender>();

                foreach (var notification in notifications)
                    await PushNewNotificationAsync(context, notification, hubSender);

                _logger.LogDebug(
                    "Background bulk notifications saved for {Count} users: {Type}",
                    notifications.Count, template.Type);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Background bulk notification failed: {Type}", template.Type);
            }
        });
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

            InvalidateCountCache(dto.UserId);

            await PushNewNotificationAsync(_context, notification, _hubSender);

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

            foreach (var userId in userIds)
                InvalidateCountCache(userId);

            foreach (var notification in notifications)
                await PushNewNotificationAsync(_context, notification, _hubSender);

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
            .AsNoTracking()
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
    // Polled every 30s by the bell badge → cached for 10s + single
    // conditional-aggregation query (COUNT(*) + COUNT(CASE WHEN ...)).
    public async Task<NotificationCountDto> GetCountAsync()
    {
        var userId = _currentUser.UserId;
        var orgId  = _currentUser.OrganizationId;

        var cacheKey = $"notif-count:{userId}";

        // Cache miss → hit the DB
        var cached = _cache.Get<NotificationCountDto>(cacheKey);
        if (cached != null) return cached;

        var result = await _context.Notifications
            .AsNoTracking()
            .Where(n =>
                n.UserId         == userId &&
                n.OrganizationId == orgId)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total  = g.Count(),
                Unread = g.Count(n => !n.IsRead),
            })
            .FirstOrDefaultAsync();

        var dto = new NotificationCountDto
        {
            TotalCount  = result?.Total  ?? 0,
            UnreadCount = result?.Unread ?? 0,
        };

        _cache.Set(cacheKey, dto, CountCacheDuration);

        return dto;
    }

    private void InvalidateCountCache(Guid userId)
        => _cache.Remove($"notif-count:{userId}");

    // ── Mark as read ───────────────────────────────────────────────
    public async Task MarkAsReadAsync(Guid notificationId)
    {
        var userId = _currentUser.UserId;

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n =>
                n.Id     == notificationId &&
                n.UserId == userId)
            ?? throw new NotFoundException("Notification", notificationId);

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            InvalidateCountCache(userId);

            try
            {
                await _hubSender.SendToUserAsync(
                    userId.ToString(), "NotificationRead", notification.Id.ToString());
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to push read receipt for notification {Id}",
                    notification.Id);
            }

            await PushUnreadCountAsync(
                userId, notification.OrganizationId, _hubSender);
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

        InvalidateCountCache(userId);

        try
        {
            await _hubSender.SendToUserAsync(
                userId.ToString(), "AllNotificationsRead", new { });
            await _hubSender.SendUnreadCountAsync(userId.ToString(), 0);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to push mark-all-read to user {UserId}", userId);
        }
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

        InvalidateCountCache(userId);

        await PushUnreadCountAsync(
            userId, _currentUser.OrganizationId, _hubSender);
    }

    // ── Delete all ────────────────────────────────────────────────────
    public async Task DeleteAllAsync()
    {
        var userId = _currentUser.UserId;
        var orgId  = _currentUser.OrganizationId;

        await _context.Notifications
            .Where(n =>
                n.UserId         == userId &&
                n.OrganizationId == orgId)
            .ExecuteDeleteAsync();

        InvalidateCountCache(userId);

        await PushUnreadCountAsync(userId, orgId, _hubSender);
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

    public Task NotifyCommentAddedAsync(
        Guid   taskOwnerId,
        Guid   organizationId,
        string taskTitle,
        Guid   taskId,
        string commenterName,
        Guid   commenterUserId)
    {
        // Don't notify if you commented on your own task
        if (taskOwnerId == commenterUserId) return Task.CompletedTask;

        CreateInBackground(new CreateNotificationDto
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

        return Task.CompletedTask;
    }

    public async Task NotifyMemberJoinedAsync(
        Guid   organizationId,
        string newMemberName,
        Guid   newMemberId,
        string role)
    {
        // Notify all Owner + Admin members
        try
        {
            using var scope  = _scopeFactory.CreateScope();
            var context      = scope.ServiceProvider
                                    .GetRequiredService<AppDbContext>();

            var adminUserIds = await context.Users
                .Where(u =>
                    u.OrganizationId == organizationId &&
                    u.IsActive       == true           &&
                    u.Id             != newMemberId    &&
                    (u.Role == UserRole.Owner || u.Role == UserRole.Admin))
                .Select(u => u.Id)
                .ToListAsync();

            if (adminUserIds.Count == 0) return;

            CreateManyInBackground(adminUserIds, new CreateNotificationDto
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to notify member joined: {Name}", newMemberName);
        }
    }

    public Task NotifyInviteAcceptedAsync(
        Guid   inviterUserId,
        Guid   organizationId,
        string newMemberName,
        string newMemberEmail)
    {
        CreateInBackground(new CreateNotificationDto
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

        return Task.CompletedTask;
    }

    public async Task NotifyProjectCreatedAsync(
        Guid   organizationId,
        string projectName,
        Guid   projectId,
        Guid   createdByUserId,
        string createdByName)
    {
        // Notify all members EXCEPT the creator
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var context     = scope.ServiceProvider
                                   .GetRequiredService<AppDbContext>();

            var memberIds   = await context.Users
                .Where(u =>
                    u.OrganizationId == organizationId &&
                    u.IsActive       == true           &&
                    u.Id             != createdByUserId)
                .Select(u => u.Id)
                .ToListAsync();

            if (memberIds.Count == 0) return;

            CreateManyInBackground(memberIds, new CreateNotificationDto
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
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to notify project created: {Name}", projectName);
        }
    }
}
