using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WorkHub.Domain.Constants;
using WorkHub.Domain.Entities;

namespace WorkHub.Infrastructure.Data.Seeding;

public class DataSeeder
{
    private readonly AppDbContext _context;
    private readonly ILogger<DataSeeder> _logger;

    // ✅ Fixed BCrypt work factor for seed data
    // Lower than production (12) so seeding is fast
    private const int SeedWorkFactor = 10;

    public DataSeeder(AppDbContext context, ILogger<DataSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        try
        {
            _logger.LogInformation("Starting database seeding...");

            if (await _context.Organizations.AnyAsync())
            {
                _logger.LogInformation("Database already seeded — skipping.");
                return;
            }

            await SeedOrganizationsAndUsersAsync();
            await SeedProjectsAsync();
            await SeedTasksAsync(); // ← ADD
            await SeedNotificationsAsync(); // ← ADD

            _logger.LogInformation("✅ Database seeding completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error during database seeding");
            throw;
        }
    }
    
    private async Task SeedTasksAsync()
    {
        var now = DateTime.UtcNow;

        var tasks = new List<WorkTask>
        {
            // ── Website Redesign Tasks ─────────────────────────────
            new WorkTask
            {
                Id = SeedReference.TaskIds.DesignMockups,
                Title = "Create UI mockups for homepage",
                Description = "Design Figma mockups for the new homepage — desktop + mobile.",
                Status = WorkTaskStatus.InProgress,
                Priority = WorkTaskPriority.High,
                ProjectId = SeedReference.ProjectIds.WebsiteRedesign,
                OrganizationId = SeedReference.OrgIds.Demo,
                CreatedByUserId = SeedReference.UserIds.DemoOwner,
                AssignedToUserId = SeedReference.UserIds.DemoAdmin,
                DueDate = now.AddDays(7),
                EstimatedMinutes = 480, // 8 hours
                OrderIndex = 1
            },
            new WorkTask
            {
                Id = SeedReference.TaskIds.SetupCms,
                Title = "Set up CMS platform",
                Description = "Evaluate and configure CMS — Contentful or Sanity.",
                Status = WorkTaskStatus.Todo,
                Priority = WorkTaskPriority.High,
                ProjectId = SeedReference.ProjectIds.WebsiteRedesign,
                OrganizationId = SeedReference.OrgIds.Demo,
                CreatedByUserId = SeedReference.UserIds.DemoAdmin,
                AssignedToUserId = SeedReference.UserIds.DemoMember1,
                DueDate = now.AddDays(14),
                EstimatedMinutes = 240,
                OrderIndex = 2
            },
            new WorkTask
            {
                Id = SeedReference.TaskIds.WriteContent,
                Title = "Write homepage copy",
                Description = "Write all copy for the new homepage — hero, features, pricing, FAQ.",
                Status = WorkTaskStatus.Todo,
                Priority = WorkTaskPriority.Medium,
                ProjectId = SeedReference.ProjectIds.WebsiteRedesign,
                OrganizationId = SeedReference.OrgIds.Demo,
                CreatedByUserId = SeedReference.UserIds.DemoAdmin,
                AssignedToUserId = SeedReference.UserIds.DemoMember2,
                DueDate = now.AddDays(10),
                EstimatedMinutes = 180,
                OrderIndex = 3
            },
            new WorkTask
            {
                Id = SeedReference.TaskIds.SeoAudit,
                Title = "Run SEO audit on current site",
                Description = "Full SEO audit using Ahrefs — identify gaps before redesign.",
                Status = WorkTaskStatus.Done,
                Priority = WorkTaskPriority.Medium,
                ProjectId = SeedReference.ProjectIds.WebsiteRedesign,
                OrganizationId = SeedReference.OrgIds.Demo,
                CreatedByUserId = SeedReference.UserIds.DemoOwner,
                AssignedToUserId = SeedReference.UserIds.DemoMember1,
                DueDate = now.AddDays(-5),
                CompletedAt = now.AddDays(-2),
                EstimatedMinutes = 120,
                ActualMinutes = 150,
                OrderIndex = 4
            },

            // ── Mobile App v2 Tasks ────────────────────────────────
            new WorkTask
            {
                Id = SeedReference.TaskIds.AppDesign,
                Title = "Design new app UI kit",
                Description = "Build a complete UI kit in Figma — typography, colors, components.",
                Status = WorkTaskStatus.InProgress,
                Priority = WorkTaskPriority.Urgent,
                ProjectId = SeedReference.ProjectIds.MobileAppV2,
                OrganizationId = SeedReference.OrgIds.Demo,
                CreatedByUserId = SeedReference.UserIds.DemoOwner,
                AssignedToUserId = SeedReference.UserIds.DemoAdmin,
                DueDate = now.AddDays(5),
                EstimatedMinutes = 600,
                OrderIndex = 1
            },
            new WorkTask
            {
                Id = SeedReference.TaskIds.AuthModule,
                Title = "Build authentication module",
                Description = "JWT auth, biometric login, refresh tokens for mobile.",
                Status = WorkTaskStatus.Todo,
                Priority = WorkTaskPriority.High,
                ProjectId = SeedReference.ProjectIds.MobileAppV2,
                OrganizationId = SeedReference.OrgIds.Demo,
                CreatedByUserId = SeedReference.UserIds.DemoOwner,
                AssignedToUserId = SeedReference.UserIds.DemoMember1,
                DueDate = now.AddDays(20),
                EstimatedMinutes = 480,
                OrderIndex = 2
            },
            new WorkTask
            {
                Id = SeedReference.TaskIds.PushNotifications,
                Title = "Implement push notifications",
                Description = "Firebase push notifications for iOS and Android.",
                Status = WorkTaskStatus.Todo,
                Priority = WorkTaskPriority.Medium,
                ProjectId = SeedReference.ProjectIds.MobileAppV2,
                OrganizationId = SeedReference.OrgIds.Demo,
                CreatedByUserId = SeedReference.UserIds.DemoAdmin,
                DueDate = now.AddDays(30),
                EstimatedMinutes = 360,
                OrderIndex = 3
            },

            // ── Acme ERP Tasks ─────────────────────────────────────
            new WorkTask
            {
                Id = SeedReference.TaskIds.ErpApiSetup,
                Title = "Set up ERP API connections",
                Description = "Map and connect all ERP API endpoints to existing systems.",
                Status = WorkTaskStatus.InProgress,
                Priority = WorkTaskPriority.Urgent,
                ProjectId = SeedReference.ProjectIds.AcmeErpIntegration,
                OrganizationId = SeedReference.OrgIds.Acme,
                CreatedByUserId = SeedReference.UserIds.AcmeOwner,
                AssignedToUserId = SeedReference.UserIds.AcmeAdmin,
                DueDate = now.AddDays(15),
                EstimatedMinutes = 720,
                OrderIndex = 1
            },
            new WorkTask
            {
                Id = SeedReference.TaskIds.DataMigration,
                Title = "Migrate legacy data to new ERP",
                Description = "Clean and migrate 5 years of historical data to the new ERP.",
                Status = WorkTaskStatus.Todo,
                Priority = WorkTaskPriority.High,
                ProjectId = SeedReference.ProjectIds.AcmeErpIntegration,
                OrganizationId = SeedReference.OrgIds.Acme,
                CreatedByUserId = SeedReference.UserIds.AcmeOwner,
                AssignedToUserId = SeedReference.UserIds.AcmeMember,
                DueDate = now.AddDays(45),
                EstimatedMinutes = 1440,
                OrderIndex = 2
            }
        };

        _context.Tasks.AddRange(tasks);
        await _context.SaveChangesAsync();

        // ── Seed TaskAssignees (multi-assignee examples) ───────────
        var taskAssignees = new List<TaskAssignee>
        {
            // Design Mockups — also assigned to Member1 as a reviewer
            new TaskAssignee
            {
                TaskId = SeedReference.TaskIds.DesignMockups,
                UserId = SeedReference.UserIds.DemoMember1,
                AssignedByUserId = SeedReference.UserIds.DemoOwner,
                AssignedAt = now
            },
            // Auth Module — also assigned to Member2
            new TaskAssignee
            {
                TaskId = SeedReference.TaskIds.AuthModule,
                UserId = SeedReference.UserIds.DemoMember2,
                AssignedByUserId = SeedReference.UserIds.DemoOwner,
                AssignedAt = now
            }
        };

        _context.TaskAssignees.AddRange(taskAssignees);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Seeded: {TaskCount} tasks, {AssigneeCount} task assignees",
            tasks.Count, taskAssignees.Count);
    }

    private async Task SeedOrganizationsAndUsersAsync()
    {
        // ──────────────────────────────────────────────────────
        // ORGANIZATION 1: WorkSphere Demo
        // Full team — Owner, Admin, 2 Members
        // Use this org for all your daily development testing
        // ──────────────────────────────────────────────────────
        var demoOrg = new Organization
        {
            Id = Guid.Parse("00000000-0000-0000-0001-000000000001"),
            Name = "WorkSphere Demo",
            Slug = "worksphere-demo",
            Description = "Primary demo organization for development testing.",
            Plan = "Free",
            IsActive = true
        };

        var demoOwner = new User
        {
            Id = Guid.Parse("00000000-0000-0000-0002-000000000001"),
            FirstName = "Demo",
            LastName = "Owner",
            Email = "demo.owner@worksphere.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                "Demo@Owner#2026", SeedWorkFactor),
            OrganizationId = demoOrg.Id,
            Role = UserRole.Owner,
            IsActive = true,
            IsEmailVerified = true
        };

        var demoAdmin = new User
        {
            Id = Guid.Parse("00000000-0000-0000-0002-000000000002"),
            FirstName = "Demo",
            LastName = "Admin",
            Email = "demo.admin@worksphere.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                "Demo@Admin#2026", SeedWorkFactor),
            OrganizationId = demoOrg.Id,
            Role = UserRole.Admin,
            IsActive = true,
            IsEmailVerified = true
        };

        var demoMember1 = new User
        {
            Id = Guid.Parse("00000000-0000-0000-0002-000000000003"),
            FirstName = "Alice",
            LastName = "Johnson",
            Email = "demo.member1@worksphere.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                "Demo@Member#2026", SeedWorkFactor),
            OrganizationId = demoOrg.Id,
            Role = UserRole.Member,
            IsActive = true,
            IsEmailVerified = true
        };

        var demoMember2 = new User
        {
            Id = Guid.Parse("00000000-0000-0000-0002-000000000004"),
            FirstName = "Bob",
            LastName = "Smith",
            Email = "demo.member2@worksphere.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                "Demo@Member#2026", SeedWorkFactor),
            OrganizationId = demoOrg.Id,
            Role = UserRole.Member,
            IsActive = true,
            IsEmailVerified = false // ← unverified for testing
        };

        // ──────────────────────────────────────────────────────
        // ORGANIZATION 2: Acme Corporation
        // Secondary org — used for cross-tenant isolation testing
        // ──────────────────────────────────────────────────────
        var acmeOrg = new Organization
        {
            Id = Guid.Parse("00000000-0000-0000-0001-000000000002"),
            Name = "Acme Corporation",
            Slug = "acme-corporation",
            Description = "Second tenant for cross-tenant isolation testing.",
            Plan = "Free",
            IsActive = true
        };

        var acmeOwner = new User
        {
            Id = Guid.Parse("00000000-0000-0000-0002-000000000005"),
            FirstName = "Acme",
            LastName = "Owner",
            Email = "acme.owner@worksphere.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                "Acme@Owner#2026", SeedWorkFactor),
            OrganizationId = acmeOrg.Id,
            Role = UserRole.Owner,
            IsActive = true,
            IsEmailVerified = true
        };

        var acmeAdmin = new User
        {
            Id = Guid.Parse("00000000-0000-0000-0002-000000000006"),
            FirstName = "Acme",
            LastName = "Admin",
            Email = "acme.admin@worksphere.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                "Acme@Admin#2026", SeedWorkFactor),
            OrganizationId = acmeOrg.Id,
            Role = UserRole.Admin,
            IsActive = true,
            IsEmailVerified = true
        };

        var acmeMember = new User
        {
            Id = Guid.Parse("00000000-0000-0000-0002-000000000007"),
            FirstName = "Carol",
            LastName = "White",
            Email = "acme.member@worksphere.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                "Acme@Member#2026", SeedWorkFactor),
            OrganizationId = acmeOrg.Id,
            Role = UserRole.Member,
            IsActive = true,
            IsEmailVerified = true
        };

        // ──────────────────────────────────────────────────────
        // ORGANIZATION 3: TechStart Ltd
        // Minimal org — only Owner, used for edge case testing
        // ──────────────────────────────────────────────────────
        var techOrg = new Organization
        {
            Id = Guid.Parse("00000000-0000-0000-0001-000000000003"),
            Name = "TechStart Ltd",
            Slug = "techstart-ltd",
            Description = "Third tenant for edge case testing.",
            Plan = "Free",
            IsActive = true
        };

        var techOwner = new User
        {
            Id = Guid.Parse("00000000-0000-0000-0002-000000000008"),
            FirstName = "Tech",
            LastName = "Founder",
            Email = "techstart.owner@worksphere.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                "Tech@Owner#2026", SeedWorkFactor),
            OrganizationId = techOrg.Id,
            Role = UserRole.Owner,
            IsActive = true,
            IsEmailVerified = true
        };

        // ── Insert all records ─────────────────────────────────
        _context.Organizations.AddRange(demoOrg, acmeOrg, techOrg);
        _context.Users.AddRange(
            demoOwner, demoAdmin, demoMember1, demoMember2,
            acmeOwner, acmeAdmin, acmeMember,
            techOwner
        );

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Seeded: 3 organizations, 8 users");
    }

    private async Task SeedProjectsAsync()
    {
        var now = DateTime.UtcNow;

        var projects = new List<Project>
        {
            // ── WorkSphere Demo: 3 projects ────────────────────
            new()
            {
                Id                = SeedReference.ProjectIds.WebsiteRedesign,
                Name              = "Website Redesign",
                Description       = "Redesign the main company website with modern UI/UX.",
                Status            = ProjectStatus.Active,
                OrganizationId    = SeedReference.OrgIds.Demo,
                CreatedByUserId   = SeedReference.UserIds.DemoOwner,
                ProjectLeadUserId = SeedReference.UserIds.DemoAdmin,
                StartDate         = now,
                DueDate           = now.AddMonths(3)
            },
            new()
            {
                Id                = SeedReference.ProjectIds.MobileAppV2,
                Name              = "Mobile App v2",
                Description       = "Build the next version of the mobile application.",
                Status            = ProjectStatus.Active,
                OrganizationId    = SeedReference.OrgIds.Demo,
                CreatedByUserId   = SeedReference.UserIds.DemoOwner,
                ProjectLeadUserId = SeedReference.UserIds.DemoAdmin,
                StartDate         = now.AddMonths(1),
                DueDate           = now.AddMonths(6)
            },
            new()
            {
                Id                = SeedReference.ProjectIds.Q3Marketing,
                Name              = "Q3 Marketing Campaign",
                Description       = "Plan and execute marketing campaigns for Q3.",
                Status            = ProjectStatus.OnHold,
                OrganizationId    = SeedReference.OrgIds.Demo,
                CreatedByUserId   = SeedReference.UserIds.DemoOwner,
                ProjectLeadUserId = SeedReference.UserIds.DemoMember1,
                StartDate         = now.AddMonths(2),
                DueDate           = now.AddMonths(5)
            },
            // ── Acme Corporation: 1 project ────────────────────
            new()
            {
                Id                = SeedReference.ProjectIds.AcmeErpIntegration,
                Name              = "ERP Integration",
                Description       = "Integrate with the corporate ERP system.",
                Status            = ProjectStatus.Active,
                OrganizationId    = SeedReference.OrgIds.Acme,
                CreatedByUserId   = SeedReference.UserIds.AcmeOwner,
                ProjectLeadUserId = SeedReference.UserIds.AcmeAdmin,
                StartDate         = now,
                DueDate           = now.AddMonths(4)
            }
        };

        _context.Projects.AddRange(projects);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Seeded: {Count} projects (Demo: 3, Acme: 1)", projects.Count);
    }

    private async Task SeedNotificationsAsync()
    {
        var now = DateTime.UtcNow;

        var notifications = new List<Notification>
        {
            // ── For DemoAdmin (Demo Owner assigned a task) ────────
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0005-000000000001"),
                UserId = SeedReference.UserIds.DemoAdmin,
                OrganizationId = SeedReference.OrgIds.Demo,
                Type = NotificationTypes.TaskAssigned,
                Title = "New task assigned to you",
                Message = "Demo Owner assigned you to \"Create UI mockups for homepage\"",
                EntityType = NotificationEntityTypes.Task,
                EntityId = SeedReference.TaskIds.DesignMockups,
                ActionUrl = $"/tasks/{SeedReference.TaskIds.DesignMockups}",
                CreatedByUserId = SeedReference.UserIds.DemoOwner,
                CreatedByName = "Demo Owner",
                IsRead = false,
                CreatedAt = now.AddHours(-2),
                Metadata = System.Text.Json.JsonSerializer.Serialize(new
                {
                    projectName = "Website Redesign",
                    taskTitle = "Create UI mockups for homepage",
                }),
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0005-000000000002"),
                UserId = SeedReference.UserIds.DemoAdmin,
                OrganizationId = SeedReference.OrgIds.Demo,
                Type = NotificationTypes.ProjectCreated,
                Title = "New project created",
                Message = "Demo Owner created project \"Mobile App v2\"",
                EntityType = NotificationEntityTypes.Project,
                EntityId = SeedReference.ProjectIds.MobileAppV2,
                ActionUrl = $"/projects/{SeedReference.ProjectIds.MobileAppV2}",
                CreatedByUserId = SeedReference.UserIds.DemoOwner,
                CreatedByName = "Demo Owner",
                IsRead = false,
                CreatedAt = now.AddHours(-26),
                Metadata = System.Text.Json.JsonSerializer.Serialize(new
                {
                    projectName = "Mobile App v2",
                }),
            },

            // ── For DemoMember1 (Alice) ────────────────────────────
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0005-000000000003"),
                UserId = SeedReference.UserIds.DemoMember1,
                OrganizationId = SeedReference.OrgIds.Demo,
                Type = NotificationTypes.TaskAssigned,
                Title = "New task assigned to you",
                Message = "Demo Owner assigned you to \"Build authentication module\"",
                EntityType = NotificationEntityTypes.Task,
                EntityId = SeedReference.TaskIds.AuthModule,
                ActionUrl = $"/tasks/{SeedReference.TaskIds.AuthModule}",
                CreatedByUserId = SeedReference.UserIds.DemoOwner,
                CreatedByName = "Demo Owner",
                IsRead = false,
                CreatedAt = now.AddHours(-3),
                Metadata = System.Text.Json.JsonSerializer.Serialize(new
                {
                    projectName = "Mobile App v2",
                    taskTitle = "Build authentication module",
                }),
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0005-000000000004"),
                UserId = SeedReference.UserIds.DemoMember1,
                OrganizationId = SeedReference.OrgIds.Demo,
                Type = NotificationTypes.CommentAdded,
                Title = "New comment on your task",
                Message = "Demo Admin commented on \"Create UI mockups for homepage\"",
                EntityType = NotificationEntityTypes.Task,
                EntityId = SeedReference.TaskIds.DesignMockups,
                ActionUrl = $"/tasks/{SeedReference.TaskIds.DesignMockups}",
                CreatedByUserId = SeedReference.UserIds.DemoAdmin,
                CreatedByName = "Demo Admin",
                IsRead = true,
                ReadAt = now.AddHours(-1),
                CreatedAt = now.AddHours(-5),
                Metadata = System.Text.Json.JsonSerializer.Serialize(new
                {
                    taskTitle = "Create UI mockups for homepage",
                }),
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0005-000000000005"),
                UserId = SeedReference.UserIds.DemoMember1,
                OrganizationId = SeedReference.OrgIds.Demo,
                Type = NotificationTypes.TaskStatusChanged,
                Title = "Your task is due soon",
                Message = "Your task \"Run SEO audit on current site\" is due within 24 hours",
                EntityType = NotificationEntityTypes.Task,
                EntityId = SeedReference.TaskIds.SeoAudit,
                ActionUrl = $"/tasks/{SeedReference.TaskIds.SeoAudit}",
                CreatedByUserId = SeedReference.UserIds.DemoOwner,
                CreatedByName = "Demo Owner",
                IsRead = false,
                CreatedAt = now.AddDays(-2),
                Metadata = System.Text.Json.JsonSerializer.Serialize(new
                {
                    projectName = "Website Redesign",
                    taskTitle = "Run SEO audit on current site",
                }),
            },

            // ── For DemoMember2 (Bob) ──────────────────────────────
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0005-000000000006"),
                UserId = SeedReference.UserIds.DemoMember2,
                OrganizationId = SeedReference.OrgIds.Demo,
                Type = NotificationTypes.InviteAccepted,
                Title = "Your invite was accepted",
                Message = "Carol White (acme.member@worksphere.io) accepted your invite",
                EntityType = NotificationEntityTypes.Member,
                ActionUrl = "/members",
                CreatedByName = "Carol White",
                IsRead = false,
                CreatedAt = now.AddHours(-6),
                Metadata = System.Text.Json.JsonSerializer.Serialize(new
                {
                    memberName = "Carol White",
                    memberEmail = "acme.member@worksphere.io",
                }),
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0005-000000000007"),
                UserId = SeedReference.UserIds.DemoMember2,
                OrganizationId = SeedReference.OrgIds.Demo,
                Type = NotificationTypes.ProjectCreated,
                Title = "New project created",
                Message = "Demo Owner created project \"Website Redesign\"",
                EntityType = NotificationEntityTypes.Project,
                EntityId = SeedReference.ProjectIds.WebsiteRedesign,
                ActionUrl = $"/projects/{SeedReference.ProjectIds.WebsiteRedesign}",
                CreatedByUserId = SeedReference.UserIds.DemoOwner,
                CreatedByName = "Demo Owner",
                IsRead = true,
                ReadAt = now.AddDays(-3),
                CreatedAt = now.AddDays(-3),
                Metadata = System.Text.Json.JsonSerializer.Serialize(new
                {
                    projectName = "Website Redesign",
                }),
            },
        };

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Seeded: {Count} notifications", notifications.Count);
    }
}