namespace WorkHub.API.DTOs.Common;

public class CurrentUserDto
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsOwner { get; set; }
    public bool IsAdminOrOwner { get; set; }
}