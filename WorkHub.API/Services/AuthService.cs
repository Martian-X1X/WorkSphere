using BCrypt.Net;
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
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext context,
        ISlugService slugService,
        ILogger<AuthService> logger)
    {
        _context = context;
        _slugService = slugService;
        _logger = logger;
    }

    public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto request)
    {
        try
        {
            // ─── Step 1: Normalize email ──────────────────────────────
            var email = request.Email.Trim().ToLowerInvariant();

            // ─── Step 2: Check if email already exists ────────────────
            var emailExists = await _context.Users
                .AnyAsync(u => u.Email == email);

            if (emailExists)
            {
                _logger.LogWarning("Registration attempt with existing email: {Email}", email);
                return ApiResponse<AuthResponseDto>.Fail(
                    "An account with this email address already exists.");
            }

            // ─── Step 3: Generate unique org slug ─────────────────────
            var slug = await _slugService.GenerateUniqueSlugAsync(request.OrganizationName);

            // ─── Step 4: Create Organization ──────────────────────────
            var organization = new Organization
            {
                Name = request.OrganizationName.Trim(),
                Slug = slug,
                Plan = "Free"
            };

            _context.Organizations.Add(organization);

            // ─── Step 5: Hash the password ────────────────────────────
            // BCrypt automatically generates a salt and hashes it
            // Work factor 12 = ~300ms on modern hardware (safe, not too slow)
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12);

            // ─── Step 6: Create User ──────────────────────────────────
            var user = new User
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = email,
                PasswordHash = passwordHash,
                OrganizationId = organization.Id,
                Role = UserRole.Owner, // First user = Owner
                IsActive = true,
                IsEmailVerified = false // Will verify via email later
            };

            _context.Users.Add(user);

            // ─── Step 7: Save both records atomically ─────────────────
            // If either insert fails, BOTH are rolled back (transaction)
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "New organization registered: {OrgName} (slug: {Slug}) by {Email}",
                organization.Name, organization.Slug, email);

            // ─── Step 8: Build response ───────────────────────────────
            var response = new AuthResponseDto
            {
                AccessToken = string.Empty, // JWT added on Day 8
                RefreshToken = string.Empty, // Refresh tokens added on Day 9
                ExpiresAt = DateTime.UtcNow, // Real expiry on Day 8
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