namespace WorkHub.Application.Interfaces;

public interface IRefreshTokenService
{
    /// <summary>
    /// Generate a cryptographically secure random refresh token string.
    /// 64 bytes → 88 base64 characters — impossible to guess.
    /// </summary>
    string GenerateRefreshToken();

    /// <summary>
    /// Get the expiry DateTime for the refresh token.
    /// Configured via JwtSettings:RefreshTokenExpiryDays.
    /// </summary>
    DateTime GetRefreshTokenExpiry();
}