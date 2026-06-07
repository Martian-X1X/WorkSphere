using WorkHub.API.DTOs.Common;
using WorkHub.API.Interfaces;

namespace WorkHub.API.Authorization;

/// <summary>
/// Guards org-scoped operations.
/// Inject this into any service that works with org-owned resources.
///
/// Usage:
///   var guard = _orgScopeGuard.Check(resource.OrganizationId);
///   if (!guard.Allowed) return ApiResponse.Fail(guard.Reason);
/// </summary>
public class OrgScopeGuard
{
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<OrgScopeGuard> _logger;

    public OrgScopeGuard(
        ICurrentUserService currentUser,
        ILogger<OrgScopeGuard> logger)
    {
        _currentUser = currentUser;
        _logger = logger;
    }

    public record GuardResult(bool Allowed, string? Reason = null);

    /// <summary>
    /// Verify the current user belongs to the same org as a resource.
    /// Returns Allowed = false with a safe error message if not.
    /// </summary>
    public GuardResult Check(Guid resourceOrgId)
    {
        if (!_currentUser.IsAuthenticated)
            return new GuardResult(false, "Authentication required.");

        if (resourceOrgId != _currentUser.OrganizationId)
        {
            // ✅ Log the IDOR attempt with full details for security audit
            _logger.LogWarning(
                "IDOR attempt: User {UserId} (Org {UserOrgId}) tried to access " +
                "resource belonging to Org {ResourceOrgId}",
                _currentUser.UserId,
                _currentUser.OrganizationId,
                resourceOrgId);

            // ✅ Return generic 404-style message — don't confirm the resource exists
            // Telling attacker "Forbidden" confirms the resource exists
            // Saying "not found" reveals nothing
            return new GuardResult(false,
                "Resource not found or you do not have access.");
        }

        return new GuardResult(true);
    }

    /// <summary>
    /// Check if the current user owns a specific resource
    /// (i.e., they created it) OR is Admin/Owner (can manage anything).
    /// </summary>
    public GuardResult CheckOwnership(Guid resourceOrgId, Guid resourceCreatorId)
    {
        // First check org scope
        var orgCheck = Check(resourceOrgId);
        if (!orgCheck.Allowed) return orgCheck;

        // Then check ownership (or admin override)
        if (resourceCreatorId != _currentUser.UserId && !_currentUser.IsAdminOrOwner)
        {
            _logger.LogWarning(
                "Ownership check failed: User {UserId} tried to modify resource " +
                "owned by {CreatorId}",
                _currentUser.UserId, resourceCreatorId);

            return new GuardResult(false,
                "You do not have permission to modify this resource.");
        }

        return new GuardResult(true);
    }
}