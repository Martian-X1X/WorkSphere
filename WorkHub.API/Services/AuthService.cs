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
    private readonly IPasswordService _passwordService; // ← NEW
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext context,
        ISlugService slugService,
        IPasswordService passwordService, // ← NEW
        ILogger<AuthService> logger)
    {
        _context = context;
        _slugService = slugService;
        _passwordService = passwordService; // ← NEW
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
}