using Microsoft.AspNetCore.Authorization;
using WorkHub.Application.Authorization;
using WorkHub.Application.Interfaces;

namespace WorkHub.API.Authorization;

/// <summary>
/// Handles PermissionRequirement — checks the current user's role
/// against the RolePermissions matrix.
///
/// Registered as a singleton so it's shared across all requests.
/// Uses ICurrentUserService (scoped) safely via IHttpContextAccessor.
/// </summary>
public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<PermissionHandler> _logger;

    public PermissionHandler(
        IHttpContextAccessor httpContextAccessor,
        ILogger<PermissionHandler> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        // Get role from JWT claims
        var roleClaim = context.User.FindFirst(
            System.Security.Claims.ClaimTypes.Role);

        if (roleClaim == null)
        {
            _logger.LogWarning(
                "Permission check failed — no role claim in token for {Permission}",
                requirement.Permission);
            return Task.CompletedTask; // Fail — no role
        }

        var role = roleClaim.Value;
        var hasPermission = RolePermissions.HasPermission(role, requirement.Permission);

        if (hasPermission)
        {
            _logger.LogDebug(
                "Permission granted: {Role} → {Permission}",
                role, requirement.Permission);
            context.Succeed(requirement);
        }
        else
        {
            _logger.LogWarning(
                "Permission denied: {Role} does not have {Permission}",
                role, requirement.Permission);
        }

        return Task.CompletedTask;
    }
}