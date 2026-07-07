using Microsoft.EntityFrameworkCore;
using WorkHub.Infrastructure.Data;
using WorkHub.Application.DTOs.Auth;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.Interfaces;
using WorkHub.Domain.Entities;

namespace WorkHub.Application.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly ISlugService _slugService;
    private readonly IPasswordService _passwordService;
    private readonly IJwtService _jwtService;
    private readonly IRefreshTokenService _refreshTokenService; // ← NEW
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext context,
        ISlugService slugService,
        IPasswordService passwordService,
        IJwtService jwtService,
        IRefreshTokenService refreshTokenService, // ← NEW
        ILogger<AuthService> logger)
    {
        _context = context;
        _slugService = slugService;
        _passwordService = passwordService;
        _jwtService = jwtService;
        _refreshTokenService = refreshTokenService; // ← NEW
        _logger = logger;
    }

    // ════════════════════════════════════════════════════════════
    // REGISTER
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto request)
    {
        try
        {
            var email = request.Email.Trim().ToLowerInvariant();

            // Validate password policy
            var passwordValidation = _passwordService.ValidatePassword(request.Password);
            if (!passwordValidation.IsValid)
                return ApiResponse<AuthResponseDto>.Fail(passwordValidation.Errors);

            // Check email uniqueness
            var emailExists = await _context.Users.AnyAsync(u => u.Email == email);
            if (emailExists)
            {
                _logger.LogWarning("Registration with existing email: {Email}", email);
                return ApiResponse<AuthResponseDto>.Fail(
                    "An account with this email address already exists.");
            }

            // Create organization
            var slug = await _slugService.GenerateUniqueSlugAsync(request.OrganizationName);
            var organization = new Organization
            {
                Name = request.OrganizationName.Trim(),
                Slug = slug,
                Plan = "Free"
            };
            _context.Organizations.Add(organization);

            // Hash password and create user
            var passwordHash = _passwordService.HashPassword(request.Password);
            var user = new User
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = email,
                PasswordHash = passwordHash,
                OrganizationId = organization.Id,
                Role = UserRole.Owner,
                IsActive = true,
                IsEmailVerified = false
            };

            // ✅ Generate refresh token on registration too
            user.RefreshToken = _refreshTokenService.GenerateRefreshToken();
            user.RefreshTokenExpiry = _refreshTokenService.GetRefreshTokenExpiry();

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "New org registered: {OrgName} by {Email}", organization.Name, email);

            var accessToken = _jwtService.GenerateAccessToken(user);
            var expiry = _jwtService.GetAccessTokenExpiry();

            return ApiResponse<AuthResponseDto>.Ok(
                BuildAuthResponse(user, organization.Name, accessToken, user.RefreshToken!, expiry),
                "Registration successful. Welcome to WorkSphere!");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for {Email}", request.Email);
            return ApiResponse<AuthResponseDto>.Fail(
                "An unexpected error occurred. Please try again.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // LOGIN
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request)
    {
        try
        {
            var email = request.Email.Trim().ToLowerInvariant();

            // Find user with organization
            var user = await _context.Users
                .Include(u => u.Organization)
                .FirstOrDefaultAsync(u => u.Email == email);

            // ✅ Same error message for wrong email AND wrong password
            // Prevents email enumeration attacks
            if (user == null)
            {
                _logger.LogWarning("Login attempt for non-existent email: {Email}", email);
                return ApiResponse<AuthResponseDto>.Fail("Invalid email or password.");
            }

            if (!user.IsActive)
            {
                _logger.LogWarning("Login on deactivated account: {Email}", email);
                return ApiResponse<AuthResponseDto>.Fail(
                    "Your account has been deactivated. Please contact support.");
            }

            // Verify password
            var passwordValid = _passwordService.VerifyPassword(
                request.Password, user.PasswordHash);

            if (!passwordValid)
            {
                _logger.LogWarning("Invalid password for: {Email}", email);
                return ApiResponse<AuthResponseDto>.Fail("Invalid email or password.");
            }

            // Silent password rehash if work factor changed
            if (_passwordService.NeedsRehash(user.PasswordHash))
            {
                _logger.LogInformation("Rehashing password for {UserId}", user.Id);
                user.PasswordHash = _passwordService.HashPassword(request.Password);
            }

            // ✅ Generate both tokens
            var accessToken = _jwtService.GenerateAccessToken(user);
            var expiry = _jwtService.GetAccessTokenExpiry();
            var refreshToken = _refreshTokenService.GenerateRefreshToken();
            var refreshExpiry = _refreshTokenService.GetRefreshTokenExpiry();

            // Store refresh token in DB
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = refreshExpiry;
            user.LastLoginAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "User {UserId} logged in from org {OrgId}", user.Id, user.OrganizationId);

            return ApiResponse<AuthResponseDto>.Ok(
                BuildAuthResponse(user, user.Organization.Name, accessToken, refreshToken, expiry),
                "Login successful.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for {Email}", request.Email);
            return ApiResponse<AuthResponseDto>.Fail(
                "An unexpected error occurred. Please try again.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // REFRESH TOKEN
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
                return ApiResponse<AuthResponseDto>.Fail("Refresh token is required.");

            // Find user by refresh token
            // IgnoreQueryFilters() needed because soft-deleted users
            // should still be found (to return proper error)
            var user = await _context.Users
                .Include(u => u.Organization)
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

            // ─── Validate token ────────────────────────────────────
            if (user == null)
            {
                _logger.LogWarning(
                    "Refresh token not found — possible token theft attempt");
                return ApiResponse<AuthResponseDto>.Fail(
                    "Invalid or expired refresh token. Please log in again.");
            }

            if (user.IsDeleted || !user.IsActive)
            {
                _logger.LogWarning(
                    "Refresh token used on deleted/inactive account: {UserId}", user.Id);
                return ApiResponse<AuthResponseDto>.Fail(
                    "Account is no longer active. Please contact support.");
            }

            if (user.RefreshTokenExpiry == null ||
                user.RefreshTokenExpiry < DateTime.UtcNow)
            {
                // Token expired — clear it from DB
                user.RefreshToken = null;
                user.RefreshTokenExpiry = null;
                await _context.SaveChangesAsync();

                _logger.LogWarning(
                    "Expired refresh token used for user {UserId}", user.Id);
                return ApiResponse<AuthResponseDto>.Fail(
                    "Refresh token has expired. Please log in again.");
            }

            // ─── Token is valid — ROTATE ───────────────────────────
            // ✅ Rotation: invalidate old token, issue brand new one
            // If attacker has the old token, it's now useless
            var newAccessToken = _jwtService.GenerateAccessToken(user);
            var newExpiry = _jwtService.GetAccessTokenExpiry();
            var newRefreshToken = _refreshTokenService.GenerateRefreshToken();
            var newRefreshExpiry = _refreshTokenService.GetRefreshTokenExpiry();

            // Update user with new tokens
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiry = newRefreshExpiry;
            user.LastLoginAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Refresh token rotated for user {UserId}", user.Id);

            return ApiResponse<AuthResponseDto>.Ok(
                BuildAuthResponse(user, user.Organization.Name,
                    newAccessToken, newRefreshToken, newExpiry),
                "Token refreshed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return ApiResponse<AuthResponseDto>.Fail(
                "An unexpected error occurred. Please try again.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // REVOKE TOKEN (Logout)
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<object>> RevokeTokenAsync(string refreshToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
                return ApiResponse<object>.Fail("Refresh token is required.");

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

            if (user == null)
            {
                // Return OK even if not found — prevents token enumeration
                _logger.LogWarning("Revoke called with unknown refresh token");
                return ApiResponse<object>.Ok(null!, "Token revoked successfully.");
            }

            // ✅ Clear the refresh token — user is now fully logged out
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Refresh token revoked for user {UserId} — logout complete", user.Id);

            return ApiResponse<object>.Ok(null!, "Logged out successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token revocation");
            return ApiResponse<object>.Fail(
                "An unexpected error occurred. Please try again.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // PRIVATE HELPER
    // ════════════════════════════════════════════════════════════
    private static AuthResponseDto BuildAuthResponse(
        User user,
        string organizationName,
        string accessToken,
        string refreshToken,
        DateTime expiresAt) => new()
    {
        AccessToken = accessToken,
        RefreshToken = refreshToken,
        ExpiresAt = expiresAt,
        User = new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            OrganizationId = user.OrganizationId.ToString(),
            OrganizationName = organizationName,
            IsEmailVerified = user.IsEmailVerified,
            ProfilePictureUrl = user.ProfilePictureUrl
        }
    };
}