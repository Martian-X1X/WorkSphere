using WorkHub.API.Models;

namespace WorkHub.API.Interfaces;

public interface IJwtService
{
    /// <summary>
    /// Generate a signed JWT access token for the given user.
    /// Contains claims: UserId, Email, Role, OrganizationId, FirstName, LastName.
    /// Expires in AccessTokenExpiryMinutes (default 15 min).
    /// </summary>
    string GenerateAccessToken(User user);

    /// <summary>
    /// Get the expiry DateTime for the access token.
    /// Used to populate ExpiresAt in the auth response.
    /// </summary>
    DateTime GetAccessTokenExpiry();
}