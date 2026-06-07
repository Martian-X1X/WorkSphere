using WorkHub.API.Models;

namespace WorkHub.API.Interfaces;

public interface IOrgContextService
{
    /// <summary>
    /// The current authenticated user's organization.
    /// Loaded once per request — subsequent calls return cached value.
    /// Returns null if user is not authenticated or org not found.
    /// </summary>
    Task<Organization?> GetCurrentOrgAsync();

    /// <summary>
    /// Check if a given organizationId belongs to the current user's org.
    /// Use this before returning any org-scoped data to prevent tenant leakage.
    /// </summary>
    Task<bool> BelongsToCurrentOrgAsync(Guid organizationId);

    /// <summary>
    /// Verify the current user is active and their org is active.
    /// Call this in middleware to block deactivated users immediately.
    /// </summary>
    Task<(bool isValid, string? reason)> ValidateCurrentUserContextAsync();
}