namespace WorkHub.API.Models;

public class User : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
    public string Role { get; set; } = UserRole.Member;
    public bool IsActive { get; set; } = true;

    public Organization Organization { get; set; } = null!;
}