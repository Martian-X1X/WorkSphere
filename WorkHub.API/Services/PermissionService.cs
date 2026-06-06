using WorkHub.API.Authorization;
using WorkHub.API.Interfaces;

namespace WorkHub.API.Services;

public class PermissionService : IPermissionService
{
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<PermissionService> _logger;

    public PermissionService(
        ICurrentUserService currentUser,
        ILogger<PermissionService> logger)
    {
        _currentUser = currentUser;
        _logger = logger;
    }

    public bool CurrentUserHasPermission(string permission)
    {
        if (!_currentUser.IsAuthenticated)
            return false;

        var result = RolePermissions.HasPermission(_currentUser.Role, permission);

        _logger.LogDebug(
            "Permission check: {UserId} ({Role}) → {Permission} = {Result}",
            _currentUser.UserId, _currentUser.Role, permission, result);

        return result;
    }

    public bool RoleHasPermission(string role, string permission)
        => RolePermissions.HasPermission(role, permission);

    public IReadOnlySet<string> GetCurrentUserPermissions()
        => RolePermissions.GetPermissions(_currentUser.Role);

    public bool CurrentUserOwns(Guid resourceOwnerId)
    {
        // User owns the resource if their ID matches the owner ID
        // OR if they're an Owner/Admin (they can manage everything)
        return _currentUser.UserId == resourceOwnerId
            || _currentUser.IsAdminOrOwner;
    }
}