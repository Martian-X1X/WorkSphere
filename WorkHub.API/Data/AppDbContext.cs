using Microsoft.EntityFrameworkCore;
using WorkHub.API.Models;

namespace WorkHub.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Organization> Organizations { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<OrganizationInvite> OrganizationInvites { get; set; }
     public DbSet<Project> Projects { get; set; }  // ← ADD
    public DbSet<WorkTask> Tasks { get; set; }

    // ✅ Auto-update timestamps + handle soft delete
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;

                case EntityState.Deleted:
                    // ✅ Intercept hard delete → convert to soft delete
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ✅ Global soft delete filter — automatically excludes deleted records
        // from ALL queries without needing to manually add .Where(x => !x.IsDeleted)
        modelBuilder.Entity<Organization>().HasQueryFilter(o => !o.IsDeleted);
        modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
        modelBuilder.Entity<OrganizationInvite>().HasQueryFilter(i => !i.IsDeleted);
        modelBuilder.Entity<Project>()
            .HasQueryFilter(p => !p.IsDeleted);   // ← ADD
        modelBuilder.Entity<WorkTask>()
    .HasQueryFilter(t => !t.IsDeleted); // <-- ADD

        // Organization configuration
        modelBuilder.Entity<Organization>(entity =>
        {
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Plan).HasMaxLength(20).HasDefaultValue("Free");
            entity.HasIndex(e => e.Slug).IsUnique();
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(20)
                  .HasDefaultValue(UserRole.Member);

            // Ignore computed property — not stored in DB
            entity.Ignore(e => e.FullName);

            // FK relationship
            entity.HasOne(e => e.Organization)
                  .WithMany(o => o.Users)
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ✅ OrganizationInvite config
        modelBuilder.Entity<OrganizationInvite>(entity =>
        {
            entity.Property(e => e.InviteeEmail).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Token).IsRequired();
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);

            // Unique index on token — each invite has a unique token
            entity.HasIndex(e => e.Token).IsUnique();

            // FK to Organization
            entity.HasOne(e => e.Organization)
                  .WithMany()
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Cascade);

            // FK to inviting user
            entity.HasOne(e => e.InvitedBy)
                  .WithMany()
                  .HasForeignKey(e => e.InvitedByUserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Project ────────────────────────────────────────────
        modelBuilder.Entity<Project>(entity =>
        {
            entity.Property(e => e.Name)
                  .IsRequired().HasMaxLength(200);
            entity.Property(e => e.Status)
                  .IsRequired().HasMaxLength(20)
                  .HasDefaultValue(ProjectStatus.Active);

            // Index for fast org-scoped project queries
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => new { e.OrganizationId, e.Status });

            // FK → Organization (cascade — delete org = delete projects)
            entity.HasOne(e => e.Organization)
                  .WithMany()
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Cascade);

            // FK → User (creator — restrict, don't delete projects if user deleted)
            entity.HasOne(e => e.CreatedBy)
                  .WithMany()
                  .HasForeignKey(e => e.CreatedByUserId)
                  .OnDelete(DeleteBehavior.Restrict);

            // FK → User (project lead — nullable, restrict)
            entity.HasOne(e => e.ProjectLead)
                  .WithMany()
                  .HasForeignKey(e => e.ProjectLeadUserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Task ───────────────────────────────────────────────
        modelBuilder.Entity<WorkTask>(entity =>
        {
            entity.Property(e => e.Title)
                  .IsRequired().HasMaxLength(500);
            entity.Property(e => e.Status)
                  .IsRequired().HasMaxLength(20)
                  .HasDefaultValue(WorkTaskStatus.Todo);
            entity.Property(e => e.Priority)
                  .IsRequired().HasMaxLength(20)
                  .HasDefaultValue(WorkTaskPriority.Medium);

            // Indexes for fast project + org scoped queries
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => new { e.ProjectId, e.Status });

            // FK → Project (cascade — delete project = delete its tasks)
            entity.HasOne(e => e.Project)
                  .WithMany(p => p.Tasks)
                  .HasForeignKey(e => e.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);

            // FK → Organization
            entity.HasOne(e => e.Organization)
                  .WithMany()
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);

            // FK → User (creator — restrict)
            entity.HasOne(e => e.CreatedBy)
                  .WithMany()
                  .HasForeignKey(e => e.CreatedByUserId)
                  .OnDelete(DeleteBehavior.Restrict);

            // FK → User (assignee — nullable, restrict)
            entity.HasOne(e => e.AssignedTo)
                  .WithMany()
                  .HasForeignKey(e => e.AssignedToUserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}