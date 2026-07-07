using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using WorkHub.Application.Interfaces;
using WorkHub.Application.Settings;

namespace WorkHub.Application.Services;

public class RefreshTokenService : IRefreshTokenService
{
    private readonly JwtSettings _settings;
    private readonly ILogger<RefreshTokenService> _logger;

    public RefreshTokenService(
        IOptions<JwtSettings> settings,
        ILogger<RefreshTokenService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public string GenerateRefreshToken()
    {
        // ✅ Cryptographically secure random bytes
        // RandomNumberGenerator is thread-safe and uses OS entropy
        // 64 bytes = 512 bits of randomness — astronomically hard to guess
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);

        // Convert to base64 URL-safe string (88 characters)
        var token = Convert.ToBase64String(randomBytes);

        _logger.LogDebug("Refresh token generated — expires {Expiry}", GetRefreshTokenExpiry());

        return token;
    }

    public DateTime GetRefreshTokenExpiry()
    {
        return DateTime.UtcNow.AddDays(_settings.RefreshTokenExpiryDays);
    }
}