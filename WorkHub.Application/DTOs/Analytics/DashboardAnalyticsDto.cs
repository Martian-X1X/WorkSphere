namespace WorkHub.Application.DTOs.Analytics;

public class DashboardAnalyticsDto
{
    public OrgStatsDto OrgStats { get; set; } = new();
    public List<TaskTrendDto> TaskTrend { get; set; } = new();
    public List<ProjectHealthDto> ProjectHealth { get; set; } = new();
    public List<TeamVelocityDto> TeamVelocity { get; set; } = new();
    public List<MyTaskDto> MyTasks { get; set; } = new();
    public List<RecentActivityDto> RecentActivity { get; set; } = new();
}

public class OrgStatsDto
{
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int OverdueTasks { get; set; }
    public int InProgressTasks { get; set; }
    public int TotalProjects { get; set; }
    public int ActiveProjects { get; set; }
    public int TotalMembers { get; set; }
    public double CompletionRate { get; set; }
}

public class TaskTrendDto
{
    public string Date { get; set; } = string.Empty;
    public int Created { get; set; }
    public int Completed { get; set; }
}

public class ProjectHealthDto
{
    public string ProjectId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int TotalTasks { get; set; }
    public int DoneTasks { get; set; }
    public int OverdueTasks { get; set; }
    public double Progress { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class TeamVelocityDto
{
    public string UserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public int Completed { get; set; }
    public int InProgress { get; set; }
    public int Assigned { get; set; }
}

public class MyTaskDto
{
    public string TaskId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public bool IsOverdue { get; set; }
}

public class RecentActivityDto
{
    public string Id { get; set; } = string.Empty;
    public string ActorName { get; set; } = string.Empty;
    public string ActorAvatar { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string? ActionUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}
