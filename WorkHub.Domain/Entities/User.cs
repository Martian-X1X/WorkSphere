using System.ComponentModel.DataAnnotations;
using WorkHub.Domain.Constants;

namespace WorkHub.Domain.Entities;
public class User : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    // Organization relationship
    public Guid OrganizationId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = UserRole.Member;

    public bool IsActive { get; set; } = true;

    // ✅ New fields added Day 5
    public bool IsEmailVerified { get; set; } = false;
    public DateTime? LastLoginAt { get; set; }
    public string? ProfilePictureUrl { get; set; }

    // Refresh token fields (used in Day 9)
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    // Email verification token (used in Day 14)
    public string? EmailVerificationToken { get; set; }
    public DateTime? EmailVerificationExpiry { get; set; }

    // Password reset token (used later)
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetExpiry { get; set; }

    // Computed property — not stored in DB
    public string FullName => $"{FirstName} {LastName}";

    // Navigation property
    public Organization Organization { get; set; } = null!;
}