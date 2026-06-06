namespace WorkHub.API.Interfaces;

public interface IPermissionService
{
    /// <summary>Check if the current authenticated user has a permission.</summary>
    bool CurrentUserHasPermission(string permission);

    /// <summary>Check if a specific role has a permission.</summary>
    bool RoleHasPermission(string role, string permission);

    /// <summary>Get all permissions for the current user's role.</summary>
    IReadOnlySet<string> GetCurrentUserPermissions();

    /// <summary>
    /// Check if the current user owns a resource.
    /// Pass the resource's owner/creator ID.
    /// Used for "update own" / "delete own" checks.
    /// </summary>
    bool CurrentUserOwns(Guid resourceOwnerId);
}