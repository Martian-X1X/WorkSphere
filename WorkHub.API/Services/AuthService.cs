using Microsoft.EntityFrameworkCore;
using WorkHub.API.Data;
using WorkHub.API.DTOs.Auth;
using WorkHub.API.DTOs.Common;
using WorkHub.API.Interfaces;
using WorkHub.API.Models;

namespace WorkHub.API.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly ISlugService _slugService;
    private readonly IPasswordService _passwordService;
    private readonly IJwtService _jwtService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext context,
        ISlugService slugService,
        IPasswordService passwordService,
        IJwtService jwtService,
        ILogger<AuthService> logger)
    {
        _context = context;
        _slugService = slugService;
        _passwordService = passwordService;
        _jwtService = jwtService;
        _logger = logger;
    }

    public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto request)
    {
        try
        {
            // ─── Step 1: Normalize email ──────────────────────────────
            var email = request.Email.Trim().ToLowerInvariant();

            // ─── Step 2: Validate password policy ────────────────────
            // ✅ NEW — validate before checking email or touching DB
            var passwordValidation = _passwordService.ValidatePassword(request.Password);
            if (!passwordValidation.IsValid)
            {
                return ApiResponse<AuthResponseDto>.Fail(passwordValidation.Errors);
            }

            // ─── Step 3: Check if email already exists ────────────────
            var emailExists = await _context.Users
                .AnyAsync(u => u.Email == email);

            if (emailExists)
            {
                _logger.LogWarning("Registration attempt with existing email: {Email}", email);
                return ApiResponse<AuthResponseDto>.Fail(
                    "An account with this email address already exists.");
            }

            // ─── Step 4: Generate unique org slug ─────────────────────
            var slug = await _slugService.GenerateUniqueSlugAsync(request.OrganizationName);

            // ─── Step 5: Create Organization ──────────────────────────
            var organization = new Organization
            {
                Name = request.OrganizationName.Trim(),
                Slug = slug,
                Plan = "Free"
            };

            _context.Organizations.Add(organization);

            // ─── Step 6: Hash password via service ────────────────────
            // ✅ Now using IPasswordService instead of BCrypt directly
            var passwordHash = _passwordService.HashPassword(request.Password);

            // ─── Step 7: Create User ──────────────────────────────────
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

            _context.Users.Add(user);

            // ─── Step 8: Save both atomically ─────────────────────────
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "New organization registered: {OrgName} (slug: {Slug}) by {Email}",
                organization.Name, organization.Slug, email);

            // ─── Step 9: Build response ───────────────────────────────
            var response = new AuthResponseDto
            {
                AccessToken = string.Empty,
                RefreshToken = string.Empty,
                ExpiresAt = DateTime.UtcNow,
                User = new UserDto
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = user.Role,
                    OrganizationId = organization.Id.ToString(),
                    OrganizationName = organization.Name,
                    IsEmailVerified = user.IsEmailVerified,
                    ProfilePictureUrl = user.ProfilePictureUrl
                }
            };

            return ApiResponse<AuthResponseDto>.Ok(
                response,
                "Registration successful. Welcome to WorkSphere!");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Unexpected error during registration for email: {Email}",
                request.Email);

            return ApiResponse<AuthResponseDto>.Fail(
                "An unexpected error occurred. Please try again.");
        }
    }

    // ─── LOGIN ────────────────────────────────────────────────────
    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request)
    {
        try
        {
            // ─── Step 1: Normalize email ──────────────────────────
            var email = request.Email.Trim().ToLowerInvariant();

            // ─── Step 2: Find user with organization ──────────────
            // Include Organization so we can return org name in response
            var user = await _context.Users
                .Include(u => u.Organization)
                .FirstOrDefaultAsync(u => u.Email == email);

            // ─── Step 3: User not found ───────────────────────────
            // IMPORTANT: Return the SAME generic message whether the email
            // doesn't exist OR the password is wrong.
            // This prevents email enumeration attacks.
            if (user == null)
            {
                _logger.LogWarning("Login attempt for non-existent email: {Email}", email);
                return ApiResponse<AuthResponseDto>.Fail(
                    "Invalid email or password.");
            }

            // ─── Step 4: Check account is active ──────────────────
            if (!user.IsActive)
            {
                _logger.LogWarning("Login attempt on deactivated account: {Email}", email);
                return ApiResponse<AuthResponseDto>.Fail(
                    "Your account has been deactivated. Please contact support.");
            }

            // ─── Step 5: Verify password ──────────────────────────
            var passwordValid = _passwordService.VerifyPassword(
                request.Password,
                user.PasswordHash);

            if (!passwordValid)
            {
                _logger.LogWarning("Invalid password attempt for: {Email}", email);
                return ApiResponse<AuthResponseDto>.Fail(
                    "Invalid email or password.");
            }

            // ─── Step 6: Silent password rehash ───────────────────
            // If the stored hash uses a lower work factor (old hash),
            // silently rehash with the current work factor on login.
            // Transparent to the user — they just log in normally.
            if (_passwordService.NeedsRehash(user.PasswordHash))
            {
                _logger.LogInformation(
                    "Rehashing password for user {UserId} (work factor upgrade)",
                    user.Id);
                user.PasswordHash = _passwordService.HashPassword(request.Password);
            }

            // ─── Step 7: Update LastLoginAt ───────────────────────
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // ─── Step 8: Generate JWT ─────────────────────────────
            var accessToken = _jwtService.GenerateAccessToken(user);
            var expiry = _jwtService.GetAccessTokenExpiry();

            _logger.LogInformation(
                "User {UserId} logged in successfully from org {OrgId}",
                user.Id, user.OrganizationId);

            // ─── Step 9: Build response ───────────────────────────
            var response = new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = string.Empty, // Added Day 9
                ExpiresAt = expiry,
                User = MapToUserDto(user, user.Organization.Name)
            };

            return ApiResponse<AuthResponseDto>.Ok(response, "Login successful.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for {Email}", request.Email);
            return ApiResponse<AuthResponseDto>.Fail(
                "An unexpected error occurred. Please try again.");
        }
    }

    // ─── PRIVATE HELPER ───────────────────────────────────────────
    private static UserDto MapToUserDto(User user, string organizationName) => new()
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
    };

}