using WorkHub.Application.Interfaces;

namespace WorkHub.Application.Authorization;

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

    public GuardResult Check(Guid resourceOrgId)
    {
        if (!_currentUser.IsAuthenticated)
            return new GuardResult(false, "Authentication required.");

        if (resourceOrgId != _currentUser.OrganizationId)
        {
            _logger.LogWarning(
                "IDOR attempt: User {UserId} (Org {UserOrgId}) tried to access " +
                "resource belonging to Org {ResourceOrgId}",
                _currentUser.UserId,
                _currentUser.OrganizationId,
                resourceOrgId);

            return new GuardResult(false,
                "Resource not found or you do not have access.");
        }

        return new GuardResult(true);
    }

    public GuardResult CheckOwnership(Guid resourceOrgId, Guid resourceCreatorId)
    {
        var orgCheck = Check(resourceOrgId);
        if (!orgCheck.Allowed) return orgCheck;

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
