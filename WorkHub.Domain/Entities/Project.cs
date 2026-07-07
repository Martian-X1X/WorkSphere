using System.ComponentModel.DataAnnotations;

namespace WorkHub.Domain.Entities;
public class Project : BaseEntity
{
    // ── Core fields ────────────────────────────────────────────
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    // ── Status ─────────────────────────────────────────────────
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = ProjectStatus.Active;

    // ── Tenant isolation ───────────────────────────────────────
    public Guid OrganizationId { get; set; }

    // ── Audit — who created this project ──────────────────────
    public Guid CreatedByUserId { get; set; }

    // ── Optional — who is the project lead ────────────────────
    public Guid? ProjectLeadUserId { get; set; }

    // ── Dates ──────────────────────────────────────────────────
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }

    // ── Navigation properties ──────────────────────────────────
    public Organization Organization { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
    public User? ProjectLead { get; set; }
    public ICollection<WorkTask> Tasks { get; set; } = new List<WorkTask>();
}

public static class ProjectStatus
{
    public const string Active   = "Active";
    public const string OnHold   = "OnHold";
    public const string Completed = "Completed";
    public const string Archived = "Archived";

    public static bool IsValid(string status) =>
        status is Active or OnHold or Completed or Archived;

    public static readonly string[] All = { Active, OnHold, Completed, Archived };
}