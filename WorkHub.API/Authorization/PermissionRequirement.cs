using Microsoft.AspNetCore.Authorization;

namespace WorkHub.API.Authorization;

/// <summary>
/// Authorization requirement that checks if the current user's role
/// has a specific permission in the RolePermissions matrix.
/// </summary>
public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }

    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }
}