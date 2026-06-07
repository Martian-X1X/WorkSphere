using Microsoft.EntityFrameworkCore;
using WorkHub.API.Data;
using WorkHub.API.Interfaces;
using WorkHub.API.Models;

namespace WorkHub.API.Services;

public class OrgContextService : IOrgContextService
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<OrgContextService> _logger;

    // ✅ Request-scoped cache — loaded once per HTTP request
    private Organization? _cachedOrg;
    private bool _orgLoaded = false;

    public OrgContextService(
        AppDbContext context,
        ICurrentUserService currentUser,
        ILogger<OrgContextService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Organization?> GetCurrentOrgAsync()
    {
        // Return cached value if already loaded this request
        if (_orgLoaded) return _cachedOrg;

        _orgLoaded = true;

        if (!_currentUser.IsAuthenticated ||
            _currentUser.OrganizationId == Guid.Empty)
        {
            _cachedOrg = null;
            return null;
        }

        _cachedOrg = await _context.Organizations
            .FirstOrDefaultAsync(o => o.Id == _currentUser.OrganizationId);

        if (_cachedOrg == null)
        {
            _logger.LogWarning(
                "Organization {OrgId} not found for user {UserId}",
                _currentUser.OrganizationId, _currentUser.UserId);
        }

        return _cachedOrg;
    }

    public async Task<bool> BelongsToCurrentOrgAsync(Guid organizationId)
    {
        if (!_currentUser.IsAuthenticated) return false;

        // Owner/Admin can access their own org data only
        return organizationId == _currentUser.OrganizationId;
    }

    public async Task<(bool isValid, string? reason)> ValidateCurrentUserContextAsync()
    {
        if (!_currentUser.IsAuthenticated)
            return (false, "Not authenticated.");

        // Load user from DB to check current active status
        // JWT claims may be stale — DB is source of truth for active status
        var user = await _context.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == _currentUser.UserId);

        if (user == null)
            return (false, "User account not found.");

        if (!user.IsActive)
            return (false, "Your account has been deactivated. Please contact support.");

        if (user.IsDeleted)
            return (false, "Your account no longer exists.");

        if (user.Organization == null)
            return (false, "Your organization could not be found.");

        if (!user.Organization.IsActive)
            return (false, "Your organization has been suspended. Please contact support.");

        if (user.Organization.IsDeleted)
            return (false, "Your organization no longer exists.");

        return (true, null);
    }
}