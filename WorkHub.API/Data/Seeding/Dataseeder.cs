using Microsoft.EntityFrameworkCore;
using WorkHub.API.Models;

namespace WorkHub.API.Data.Seeding;

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

            // ✅ Idempotent check — if seed data already exists, skip
            if (await _context.Organizations.AnyAsync())
            {
                _logger.LogInformation(
                    "Database already seeded — skipping. " +
                    "Delete all records to re-seed.");
                return;
            }

            await SeedOrganizationsAndUsersAsync();
            await SeedProjectsAsync();

            _logger.LogInformation("✅ Database seeding completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error during database seeding");
            throw;
        }
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
}