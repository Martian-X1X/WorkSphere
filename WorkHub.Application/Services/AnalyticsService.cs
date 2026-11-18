using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WorkHub.Application.DTOs.Analytics;
using WorkHub.Application.Interfaces;
using WorkHub.Domain.Entities;
using WorkHub.Infrastructure.Data;

namespace WorkHub.Application.Services;

public class AnalyticsService : IAnalyticsService
{
    private static readonly string[] ProjectColors =
    {
        "#38bdf8", "#818cf8", "#34d399", "#fbbf24",
        "#f472b6", "#a78bfa", "#22d3ee", "#fb7185",
    };

    private readonly AppDbContext _db;

    public AnalyticsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardAnalyticsDto> GetDashboardAsync(
        Guid organizationId,
        Guid currentUserId,
        int trendDays = 30)
    {
        var now = DateTime.UtcNow;
        trendDays = Math.Clamp(trendDays, 1, 365);
        var trendStart = now.AddDays(-trendDays).Date;

        var orgStats = await GetOrgStatsAsync(organizationId, now);
        var taskTrend = await GetTaskTrendAsync(organizationId, trendStart, now);
        var projectHealth = await GetProjectHealthAsync(organizationId, now);
        var teamVelocity = await GetTeamVelocityAsync(organizationId, now);
        var myTasks = await GetMyTasksAsync(organizationId, currentUserId, now);
        var recentActivity = await GetRecentActivityAsync(organizationId);

        return new DashboardAnalyticsDto
        {
            OrgStats = orgStats,
            TaskTrend = taskTrend,
            ProjectHealth = projectHealth,
            TeamVelocity = teamVelocity,
            MyTasks = myTasks,
            RecentActivity = recentActivity,
        };
    }

    private async Task<OrgStatsDto> GetOrgStatsAsync(Guid orgId, DateTime now)
    {
        var taskStats = await _db.Tasks
            .Where(t => t.OrganizationId == orgId && !t.IsDeleted)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Completed = g.Count(t => t.Status == WorkTaskStatus.Done),
                InProgress = g.Count(t => t.Status == WorkTaskStatus.InProgress),
                Overdue = g.Count(t => t.DueDate.HasValue
                    && t.DueDate.Value < now
                    && t.Status != WorkTaskStatus.Done),
            })
            .FirstOrDefaultAsync();

        var projectStats = await _db.Projects
            .Where(p => p.OrganizationId == orgId && !p.IsDeleted)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Active = g.Count(p => p.Status == ProjectStatus.Active),
            })
            .FirstOrDefaultAsync();

        var members = await _db.Users
            .CountAsync(u => u.OrganizationId == orgId
                && u.IsActive
                && !u.IsDeleted);

        var total = taskStats?.Total ?? 0;
        var completed = taskStats?.Completed ?? 0;

        return new OrgStatsDto
        {
            TotalTasks = total,
            CompletedTasks = completed,
            InProgressTasks = taskStats?.InProgress ?? 0,
            OverdueTasks = taskStats?.Overdue ?? 0,
            TotalProjects = projectStats?.Total ?? 0,
            ActiveProjects = projectStats?.Active ?? 0,
            TotalMembers = members,
            CompletionRate = total == 0
                ? 0
                : Math.Round((double)completed / total * 100, 1),
        };
    }

    private async Task<List<TaskTrendDto>> GetTaskTrendAsync(
        Guid orgId, DateTime start, DateTime end)
    {
        var createdDates = await _db.Tasks
            .Where(t => t.OrganizationId == orgId
                && !t.IsDeleted
                && t.CreatedAt >= start
                && t.CreatedAt <= end)
            .Select(t => t.CreatedAt)
            .ToListAsync();

        var completedDates = await _db.Tasks
            .Where(t => t.OrganizationId == orgId
                && !t.IsDeleted
                && t.Status == WorkTaskStatus.Done
                && t.CompletedAt.HasValue
                && t.CompletedAt.Value >= start
                && t.CompletedAt.Value <= end)
            .Select(t => t.CompletedAt!.Value)
            .ToListAsync();

        var createdByDate = createdDates
            .GroupBy(d => d.Date)
            .ToDictionary(g => g.Key, g => g.Count());
        var completedByDate = completedDates
            .GroupBy(d => d.Date)
            .ToDictionary(g => g.Key, g => g.Count());

        var trend = new List<TaskTrendDto>();
        for (var day = start; day <= end; day = day.AddDays(1))
        {
            trend.Add(new TaskTrendDto
            {
                Date = day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                Created = createdByDate.GetValueOrDefault(day),
                Completed = completedByDate.GetValueOrDefault(day),
            });
        }

        return trend;
    }

    private async Task<List<ProjectHealthDto>> GetProjectHealthAsync(
        Guid orgId, DateTime now)
    {
        var projects = await _db.Projects
            .Where(p => p.OrganizationId == orgId
                && !p.IsDeleted
                && p.Status == ProjectStatus.Active)
            .OrderBy(p => p.Name)
            .Take(10)
            .Select(p => new { p.Id, p.Name })
            .ToListAsync();

        if (projects.Count == 0)
            return new List<ProjectHealthDto>();

        var projectIds = projects.Select(p => p.Id).ToList();

        var tasks = await _db.Tasks
            .Where(t => t.OrganizationId == orgId
                && !t.IsDeleted
                && projectIds.Contains(t.ProjectId))
            .Select(t => new { t.ProjectId, t.Status, t.DueDate })
            .ToListAsync();

        var tasksByProject = tasks
            .GroupBy(t => t.ProjectId)
            .ToDictionary(g => g.Key, g => g
                .Select(t => new TaskHealthInfo(t.Status, t.DueDate))
                .ToList());

        return projects.Select(p =>
        {
            var projectTasks = tasksByProject.GetValueOrDefault(p.Id)
                ?? new List<TaskHealthInfo>();
            return BuildProjectHealth(p.Id, p.Name, projectTasks, now);
        }).ToList();
    }

    private sealed record TaskHealthInfo(string Status, DateTime? DueDate);

    private static ProjectHealthDto BuildProjectHealth(
        Guid id,
        string name,
        IReadOnlyCollection<TaskHealthInfo> projectTasks,
        DateTime now)
    {
        var total = projectTasks.Count;
        var done = projectTasks.Count(t => t.Status == WorkTaskStatus.Done);
        var overdue = projectTasks.Count(t =>
            t.DueDate.HasValue
            && t.DueDate.Value < now
            && t.Status != WorkTaskStatus.Done);
        var progress = total == 0
            ? 0
            : Math.Round((double)done / total * 100, 1);

        var status = overdue > 0 && progress < 25 ? "Behind"
            : overdue > 0 ? "AtRisk"
            : "OnTrack";

        return new ProjectHealthDto
        {
            ProjectId = id.ToString(),
            ProjectName = name,
            Color = ProjectColors[(id.GetHashCode() & int.MaxValue)
                % ProjectColors.Length],
            TotalTasks = total,
            DoneTasks = done,
            OverdueTasks = overdue,
            Progress = progress,
            Status = status,
        };
    }

    private async Task<List<TeamVelocityDto>> GetTeamVelocityAsync(
        Guid orgId, DateTime now)
    {
        var weekStart = now.AddDays(-7).Date;

        var members = await _db.Users
            .Where(u => u.OrganizationId == orgId
                && u.IsActive
                && !u.IsDeleted)
            .OrderBy(u => u.FirstName)
            .Take(10)
            .Select(u => new
            {
                u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                u.ProfilePictureUrl,
            })
            .ToListAsync();

        if (members.Count == 0)
            return new List<TeamVelocityDto>();

        var memberIds = members.Select(m => m.Id).ToList();

        var tasks = await _db.Tasks
            .Where(t => t.OrganizationId == orgId
                && !t.IsDeleted
                && t.AssignedToUserId.HasValue
                && memberIds.Contains(t.AssignedToUserId.Value))
            .Select(t => new
            {
                UserId = t.AssignedToUserId!.Value,
                t.Status,
                t.CompletedAt,
            })
            .ToListAsync();

        var weekCompleted = tasks
            .Where(t => t.Status == WorkTaskStatus.Done
                && t.CompletedAt.HasValue
                && t.CompletedAt.Value >= weekStart)
            .GroupBy(t => t.UserId)
            .ToDictionary(g => g.Key, g => g.Count());
        var inProgress = tasks
            .Where(t => t.Status == WorkTaskStatus.InProgress)
            .GroupBy(t => t.UserId)
            .ToDictionary(g => g.Key, g => g.Count());
        var assigned = tasks
            .Where(t => t.Status != WorkTaskStatus.Done)
            .GroupBy(t => t.UserId)
            .ToDictionary(g => g.Key, g => g.Count());

        return members.Select(m => new TeamVelocityDto
        {
            UserId = m.Id.ToString(),
            FullName = $"{m.FirstName} {m.LastName}".Trim(),
            Avatar = m.ProfilePictureUrl ?? string.Empty,
            Completed = weekCompleted.GetValueOrDefault(m.Id),
            InProgress = inProgress.GetValueOrDefault(m.Id),
            Assigned = assigned.GetValueOrDefault(m.Id),
        })
        .OrderByDescending(m => m.Completed)
        .ThenBy(m => m.FullName)
        .ToList();
    }

    private async Task<List<MyTaskDto>> GetMyTasksAsync(
        Guid orgId, Guid userId, DateTime now)
    {
        return await _db.Tasks
            .Where(t => t.OrganizationId == orgId
                && t.AssignedToUserId == userId
                && !t.IsDeleted
                && t.Status != WorkTaskStatus.Done
                && t.Status != WorkTaskStatus.Cancelled)
            .OrderBy(t => t.DueDate.HasValue ? 0 : 1)
            .ThenBy(t => t.DueDate)
            .Take(10)
            .Select(t => new MyTaskDto
            {
                TaskId = t.Id.ToString(),
                Title = t.Title,
                ProjectName = t.Project.Name,
                ProjectId = t.ProjectId.ToString(),
                Status = t.Status,
                Priority = t.Priority,
                DueDate = t.DueDate,
                IsOverdue = t.DueDate.HasValue && t.DueDate.Value < now,
            })
            .ToListAsync();
    }

    private async Task<List<RecentActivityDto>> GetRecentActivityAsync(Guid orgId)
    {
        var logs = await _db.ActivityLogs
            .Where(a => a.OrganizationId == orgId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .Select(a => new
            {
                a.Id,
                a.UserId,
                a.UserName,
                a.Action,
                a.EntityType,
                a.EntityId,
                a.EntityName,
                a.ProjectId,
                a.Metadata,
                a.CreatedAt,
            })
            .ToListAsync();

        if (logs.Count == 0)
            return new List<RecentActivityDto>();

        var userIds = logs.Select(a => a.UserId).Distinct().ToList();
        var projectIds = logs
            .Where(a => a.ProjectId.HasValue)
            .Select(a => a.ProjectId!.Value)
            .Distinct()
            .ToList();

        var avatars = await _db.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.ProfilePictureUrl })
            .ToDictionaryAsync(u => u.Id, u => u.ProfilePictureUrl);

        var projectNames = await _db.Projects
            .Where(p => projectIds.Contains(p.Id))
            .Select(p => new { p.Id, p.Name })
            .ToDictionaryAsync(p => p.Id, p => p.Name);

        return logs.Select(a => new RecentActivityDto
        {
            Id = a.Id.ToString(),
            ActorName = a.UserName,
            ActorAvatar = avatars.GetValueOrDefault(a.UserId) ?? string.Empty,
            Action = GetActionVerb(a.Action, a.Metadata),
            EntityType = a.EntityType,
            EntityName = a.EntityName ?? a.EntityType,
            ProjectName = a.ProjectId.HasValue
                ? projectNames.GetValueOrDefault(a.ProjectId.Value) ?? string.Empty
                : string.Empty,
            ActionUrl = GetActionUrl(a.EntityType, a.EntityId, a.ProjectId),
            CreatedAt = a.CreatedAt,
        }).ToList();
    }

    private static string GetActionVerb(string action, string? metadata)
    {
        if (action == ActivityAction.TaskStatusChanged
            && !string.IsNullOrWhiteSpace(metadata))
        {
            try
            {
                using var json = JsonDocument.Parse(metadata);
                if (json.RootElement.TryGetProperty("to", out var to)
                    && to.GetString() == WorkTaskStatus.Done)
                    return "completed";
            }
            catch (JsonException)
            {
            }
        }

        return action switch
        {
            ActivityAction.ProjectCreated or ActivityAction.TaskCreated => "created",
            ActivityAction.ProjectUpdated or ActivityAction.ProjectStatusChanged
                or ActivityAction.TaskUpdated or ActivityAction.TaskStatusChanged
                or ActivityAction.CommentEdited or ActivityAction.MemberRoleChanged => "updated",
            ActivityAction.ProjectDeleted or ActivityAction.TaskDeleted
                or ActivityAction.CommentDeleted => "deleted",
            ActivityAction.TaskAssigned or ActivityAction.CollaboratorAdded => "assigned",
            ActivityAction.TaskUnassigned or ActivityAction.CollaboratorRemoved => "unassigned",
            ActivityAction.CommentAdded => "commented",
            ActivityAction.MemberInvited => "invited",
            ActivityAction.MemberJoined => "joined",
            ActivityAction.MemberDeactivated => "deactivated",
            _ => action,
        };
    }

    private static string? GetActionUrl(
        string entityType, Guid entityId, Guid? projectId)
    {
        return entityType switch
        {
            ActivityEntityType.Project => $"/projects/{entityId}",
            ActivityEntityType.Task => $"/tasks/{entityId}",
            ActivityEntityType.Comment => projectId.HasValue
                ? $"/tasks/{projectId.Value}"
                : null,
            ActivityEntityType.Member or ActivityEntityType.Invite => "/members",
            _ => null,
        };
    }
}
