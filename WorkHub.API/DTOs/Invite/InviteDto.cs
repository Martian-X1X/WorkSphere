using System.ComponentModel.DataAnnotations;

namespace WorkHub.API.DTOs.Invite;

/// <summary>Request body to send an invite</summary>
public class CreateInviteDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email address")]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Role is required")]
    public string Role { get; set; } = "Member";
}

/// <summary>Invite details returned to the sender</summary>
public class InviteResponseDto
{
    public Guid Id { get; set; }
    public string InviteeEmail { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string InviteLink { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string InvitedByName { get; set; } = string.Empty;
}

/// <summary>Public invite preview — shown before accepting</summary>
public class InvitePreviewDto
{
    public string OrganizationName { get; set; } = string.Empty;
    public string OrganizationSlug { get; set; } = string.Empty;
    public string InvitedByName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsExpired { get; set; }
    public bool IsAlreadyAccepted { get; set; }
}

/// <summary>Accept invite — new user registers and joins org</summary>
public class AcceptInviteDto
{
    [Required(ErrorMessage = "First name is required")]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    public string Password { get; set; } = string.Empty;
}