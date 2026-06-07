namespace WorkHub.API.DTOs.Common;

/// <summary>
/// Snapshot of the current request's authorization context.
/// Returned by GET /api/auth/context for debugging.
/// </summary>
public class AuthContextDto
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public bool IsEmailVerified { get; set; }
    public bool IsOwner { get; set; }
    public bool IsAdminOrOwner { get; set; }
    public bool OrgIsActive { get; set; }
    public string OrgPlan { get; set; } = string.Empty;
    public List<string> Permissions { get; set; } = new();
}