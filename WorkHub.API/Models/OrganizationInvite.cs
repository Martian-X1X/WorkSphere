using System.ComponentModel.DataAnnotations;

namespace WorkHub.API.Models;

public class OrganizationInvite : BaseEntity
{
    // The org this invite belongs to
    public Guid OrganizationId { get; set; }

    // Who sent the invite
    public Guid InvitedByUserId { get; set; }

    // Who the invite is for
    [Required]
    [MaxLength(100)]
    [EmailAddress]
    public string InviteeEmail { get; set; } = string.Empty;

    // What role they'll get when they join
    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = UserRole.Member;

    // The secure token sent in the invite link
    [Required]
    public string Token { get; set; } = string.Empty;

    // When this invite expires
    public DateTime ExpiresAt { get; set; }

    // Status tracking
    [MaxLength(20)]
    public string Status { get; set; } = InviteStatus.Pending;

    // When they accepted (null if not yet accepted)
    public DateTime? AcceptedAt { get; set; }

    // The user ID that accepted (null until accepted)
    public Guid? AcceptedByUserId { get; set; }

    // Navigation properties
    public Organization Organization { get; set; } = null!;
    public User InvitedBy { get; set; } = null!;
}

public static class InviteStatus
{
    public const string Pending  = "Pending";
    public const string Accepted = "Accepted";
    public const string Expired  = "Expired";
    public const string Cancelled = "Cancelled";

    public static bool IsValid(string status) =>
        status is Pending or Accepted or Expired or Cancelled;
}