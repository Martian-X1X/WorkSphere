using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using WorkHub.Application.Interfaces;
using WorkHub.Domain.Entities;
using WorkHub.Application.Settings;

namespace WorkHub.Application.Services;

public class JwtService : IJwtService
{
    private readonly JwtSettings _settings;
    private readonly ILogger<JwtService> _logger;

    public JwtService(IOptions<JwtSettings> settings, ILogger<JwtService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public string GenerateAccessToken(User user)
    {
        // ─── Step 1: Create signing key from secret ───────────────
        // HMAC-SHA256 — symmetric signing algorithm
        // Same key used to sign AND verify — kept server-side only
        var keyBytes = Encoding.UTF8.GetBytes(_settings.Secret);
        var signingKey = new SymmetricSecurityKey(keyBytes);
        var signingCredentials = new SigningCredentials(
            signingKey,
            SecurityAlgorithms.HmacSha256);

        // ─── Step 2: Define claims ─────────────────────────────────
        // Claims are the data payload embedded inside the JWT
        // These are readable by anyone with the token (base64 decoded)
        // NEVER put sensitive data (passwords, secrets) in claims
        var claims = new[]
        {
            // Standard JWT claims
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat,
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64),

            // WorkSphere custom claims
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(ClaimTypes.GivenName, user.FirstName),
            new Claim(ClaimTypes.Surname, user.LastName),
            new Claim("org_id", user.OrganizationId.ToString()),
            new Claim("full_name", user.FullName),
            new Claim("is_email_verified", user.IsEmailVerified.ToString().ToLower())
        };

        // ─── Step 3: Set token expiry ──────────────────────────────
        var expiry = GetAccessTokenExpiry();

        // ─── Step 4: Build the token descriptor ───────────────────
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiry,
            Issuer = _settings.Issuer,
            Audience = _settings.Audience,
            SigningCredentials = signingCredentials
        };

        // ─── Step 5: Create and serialize the token ───────────────
        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        _logger.LogDebug(
            "JWT access token generated for user {UserId} — expires {Expiry}",
            user.Id, expiry);

        return tokenString;
    }

    public DateTime GetAccessTokenExpiry()
    {
        return DateTime.UtcNow.AddMinutes(_settings.AccessTokenExpiryMinutes);
    }
}