using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WorkHub.API.Data;
using WorkHub.API.Interfaces;
using WorkHub.API.Models;

namespace WorkHub.API.Services;

public class ActivityService : IActivityService
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<ActivityService> _logger;

    public ActivityService(
        AppDbContext context,
        ICurrentUserService currentUser,
        ILogger<ActivityService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _logger = logger;
    }

    // ════════════════════════════════════════════════════════════
    // LOG ACTIVITY
    // ════════════════════════════════════════════════════════════
    public async Task LogAsync(
        string action,
        string entityType,
        Guid entityId,
        string? entityName = null,
        Guid? projectId = null,
        object? metadata = null)
    {
        try
        {
            var log = new ActivityLog
            {
                UserId = _currentUser.UserId,
                UserName = _currentUser.FullName,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                EntityName = entityName,
                ProjectId = projectId,
                OrganizationId = _currentUser.OrganizationId,
                Metadata = metadata != null
                    ? JsonSerializer.Serialize(metadata)
                    : null,
                CreatedAt = DateTime.UtcNow
            };

            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // ✅ Activity logging MUST NOT break the main operation.
            // Log the failure but let the caller succeed.
            _logger.LogError(ex,
                "Failed to write activity log: {Action} on {EntityType} {EntityId}",
                action, entityType, entityId);
        }
    }

    // ════════════════════════════════════════════════════════════
    // GET ORG ACTIVITY
    // ════════════════════════════════════════════════════════════
    public async Task<List<ActivityLogDto>> GetOrgActivityAsync(
        int page = 1, int pageSize = 50)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var logs = await _context.ActivityLogs
            .Where(l => l.OrganizationId == _currentUser.OrganizationId)
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return logs.Select(MapToDto).ToList();
    }

    // ════════════════════════════════════════════════════════════
    // GET PROJECT ACTIVITY
    // ════════════════════════════════════════════════════════════
    public async Task<List<ActivityLogDto>> GetProjectActivityAsync(
        Guid projectId, int page = 1, int pageSize = 50)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        // All activity where ProjectId matches OR the entity IS the project
        var logs = await _context.ActivityLogs
            .Where(l =>
                l.OrganizationId == _currentUser.OrganizationId &&
                (l.ProjectId == projectId ||
                 (l.EntityType == ActivityEntityType.Project &&
                  l.EntityId == projectId)))
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return logs.Select(MapToDto).ToList();
    }

    // ════════════════════════════════════════════════════════════
    // GET TASK ACTIVITY
    // ════════════════════════════════════════════════════════════
    public async Task<List<ActivityLogDto>> GetTaskActivityAsync(
        Guid taskId, int page = 1, int pageSize = 50)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        // Task events + comment events on this task
        var logs = await _context.ActivityLogs
            .Where(l =>
                l.OrganizationId == _currentUser.OrganizationId &&
                (l.EntityId == taskId ||
                 (l.EntityType == ActivityEntityType.Comment &&
                  l.ProjectId == taskId))) // we store taskId in ProjectId for comments
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return logs.Select(MapToDto).ToList();
    }

    // ════════════════════════════════════════════════════════════
    // PRIVATE MAPPER
    // ════════════════════════════════════════════════════════════
    private static ActivityLogDto MapToDto(ActivityLog log) => new()
    {
        Id = log.Id,
        Action = log.Action,
        EntityType = log.EntityType,
        EntityId = log.EntityId,
        EntityName = log.EntityName,
        ProjectId = log.ProjectId,
        UserId = log.UserId,
        UserName = log.UserName,
        Metadata = log.Metadata,
        CreatedAt = log.CreatedAt
    };
}